import { Plugin, type Editor } from 'ckeditor5';
import InsertFrontmatterCommand from './insertfrontmattercommand.js';
import {
	findFrontmatterContainer,
	inFrontmatter,
	isFrontmatterEnd,
	removeSoftBreakBeforeSelection
} from './utils.js';

export default class FrontmatterEditing extends Plugin {
	public static get pluginName() {
		return 'FrontmatterEditing' as const;
	}

	declare public frontmatterLoaded: boolean;

	constructor( editor: Editor ) {
		super( editor );

		// Define an observable property
		this.set( 'frontmatterLoaded', false );
	}

	public init(): void {
		this._defineSchema();
		this._defineConversion();

		// Augument editor for frontmatter API.
		this._defineDataApi();

		// Enter is a soft break inside the frontmatter.
		this._defineEnterInFrontmatter();

		// Move frontmatter to the top.
		this._registerFrontmatterPostfixer();

		// TODO fix the HTML clipboard. The frontmatter is not detected on paste.

		// Access the configuration
		const frontmatterConfig = this.editor.config.get( 'frontmatter' );

		this.editor.commands.add(
			'insertFrontmatter',
			new InsertFrontmatterCommand( this.editor, frontmatterConfig )
		);
	}

	private _defineSchema() {
		const editor = this.editor;
		const schema = editor.model.schema;

		schema.register( 'frontmatterContainer', {
			inheritAllFrom: '$container',
			allowIn: '$root'
		} );

		schema.register( 'frontmatter', {
			allowIn: 'frontmatterContainer',
			allowChildren: '$text',
			// Disallow `$inlineObject` and its derivatives like `inlineWidget` inside `codeBlock` to ensure that only text,
			// not other inline elements like inline images, are allowed. This maintains the semantic integrity of code blocks.
			disallowChildren: '$inlineObject',
			isBlock: true
		} );

		// Add a check to disallow attributes inside frontmatter.
		schema.addAttributeCheck( context => {
			if ( context.endsWith( 'frontmatter $text' ) ) {
				return false;
			}
		} );
	}

	private _defineConversion() {
		const editor = this.editor;
		const conversion = editor.conversion;

		// <frontmatterContainer> converters
		conversion.for( 'upcast' ).elementToElement( {
			model: 'frontmatterContainer',
			view: {
				name: 'section',
				classes: 'frontmatter-container'
			}
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'frontmatterContainer',
			view: {
				name: 'section',
				classes: 'frontmatter-container'
			}
		} );

		conversion.for( 'dataDowncast' ).elementToStructure( {
			model: 'frontmatterContainer',
			view: ( _model, conversionApi ) => {
				const { writer } = conversionApi;

				// To easier replace borders in getDataWithFrontmatter we use unique border symbols.
				const frontmatterBorderStart = writer.createText( '>>>' );
				const frontmatterBorderEnd = writer.createText( '<<<' );

				return writer.createContainerElement( 'section', {}, [
					frontmatterBorderStart,
					writer.createSlot(),
					frontmatterBorderEnd
				] );
			}
		} );

		// <frontmatter> converters
		conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'div',
				classes: 'frontmatter'
			},
			model: 'frontmatter'
		} );

		// Model to View conversion.
		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'frontmatter',
			view: {
				// We use custom element if someone would like to
				// keepHtml div for example.
				name: 'div',
				classes: 'frontmatter'
			}
		} );

		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'frontmatter',
			view: {
				// We use custom element if someone would like to
				// keepHtml div for example.
				name: 'frontmatter'
			}
		} );
	}

	private _defineDataApi() {
		const editor = this.editor;

		editor.setDataWithFrontmatter = ( data: string ) => {
			const frontmatterRegex = /---\n([\s\S]*?)\n---/;
			const dataWithHtmlFrontmatter = data.replace(
				frontmatterRegex,
				( _match, frontmatterContent ) => {
					// Replace newlines with <br> for HTML display
					const formattedFrontmatter = frontmatterContent
						.replace( /\n+/g, '<br>' )
						.replace( /\\+([[\]\-_>"'])/g, '$1' ); // yaml frontmatter can have unescaped chars like [, > or -
					return `<section class="frontmatter-container"><div class="frontmatter">${ formattedFrontmatter }</div></section>`;
				}
			);
			editor.data.set( dataWithHtmlFrontmatter );
		};

		editor.getDataWithFrontmatter = (): string => {
			const data = editor.data.get();

			let fixedFrontmatter = data
				.replace( /\\>>>\n*/g, '---\n' ) // Frontmatter start.
				.replace( /\\<\\<\\<\n*/g, '\n---\n\n' ); // Frontmatter end.

			fixedFrontmatter = fixedFrontmatter.replace(
				/---\n([\s\S]*?)\n---/,
				( _match, frontmatterContent ) => {
					// Remove multiple consecutive spaces within frontmatter
					const cleanedFrontmatter = frontmatterContent
						.replace( / {2,}/g, '' )
						.replace( /\\+([[\]\-_>"'])/g, '$1' ); // yaml frontmatter can have unescaped chars like [, > or -
					return `---\n${ cleanedFrontmatter }\n---`;
				}
			);

			return fixedFrontmatter;
		};
	}

	private _defineEnterInFrontmatter() {
		const editor = this.editor;
		const selection = editor.model.document.selection;

		editor.editing.view.document.on(
			'enter',
			( evt, data ) => {
				if ( !inFrontmatter( selection ) ) {
					return;
				}

				if ( isFrontmatterEnd( selection ) ) {
					const frontmatterContainer =
						findFrontmatterContainer( selection );

					if ( !frontmatterContainer ) {
						return;
					}

					removeSoftBreakBeforeSelection( selection, editor.model );

					editor.model.change( writer => {
						const positionAfterElement =
							writer.createPositionAfter( frontmatterContainer );

						editor.execute( 'insertParagraph', {
							position: positionAfterElement
						} );
					} );

					// Still need to prevent the enter.
					data.preventDefault();
					evt.stop();
					editor.editing.view.scrollToTheSelection();
				} else {
					data.preventDefault();
					evt.stop();
					editor.execute( 'shiftEnter' );
					editor.editing.view.scrollToTheSelection();
				}
			},
			{ priority: 'high' }
		);
	}

	private _registerFrontmatterPostfixer() {
		const model = this.editor.model;
		const document = model.document;

		document.registerPostFixer( writer => {
			const root = document.getRoot();

			if ( !root ) {
				return false;
			}

			const changes = document.differ.getChanges();

			for ( const entry of changes ) {
				if ( entry.type == 'insert' && entry.name === 'frontmatterContainer' ) {
					this.set( 'frontmatterLoaded', true );

					const possibleFrontmatterContainer = root.getChild( 0 );

					if (
						possibleFrontmatterContainer &&
						possibleFrontmatterContainer.is( 'element', 'frontmatterContainer' )
					) {
						// If the frontmatterContainer is already at the top, no change is needed
						return false;
					}

					const frontmatterContainer = entry.position.nodeAfter;

					if ( !frontmatterContainer ) {
						return false;
					}

					const startPosition = model.createPositionAt( root, 0 );

					// Move the frontmatterContainer to the start of the document
					writer.move(
						writer.createRangeOn( frontmatterContainer ),
						startPosition
					);

					// Indicate that changes were made
					return true;
				}

				// const range = model.createRangeIn( root );
				if ( entry.type == 'remove' && entry.name === 'frontmatterContainer' ) {
					this.set( 'frontmatterLoaded', false );
				}
			}

			// No changes were made
			return false;
		} );
	}
}

