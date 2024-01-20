import { Plugin } from 'ckeditor5/src/core';
import { toWidgetEditable, Widget } from 'ckeditor5/src/widget';
import InsertFrontmatterCommand from './insertfrontmattercommand';
import {
	findFrontmatterContainer,
	inFrontmatter,
	isFrontmatterEnd,
	removeSoftBreakBeforeSelection
} from './utils';

export default class FrontmatterEditing extends Plugin {
	public static get requires() {
		return [ Widget ] as const;
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
		const root = editor.model.document.getRoot();

		schema.register( 'frontmatterContainer', {
			inheritAllFrom: '$blockObject'
		} );

		schema.register( 'frontmatter', {
			isLimit: true,
			allowContentOf: '$block',
			allowIn: 'frontmatterContainer'
		} );

		// Add a check to ensure only one frontmatterContainer is created
		schema.addChildCheck( ( _context, childDefinition ) => {
			if ( childDefinition.name === 'frontmatterContainer' && root ) {
				for ( const child of root.getChildren() ) {
					if ( child.is( 'element', 'frontmatterContainer' ) ) {
						return false;
					}
				}
			}
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
			view: ( _modelElement, { writer: viewWriter } ) => {
				const widgetElement = viewWriter.createEditableElement( 'div', {
					class: 'frontmatter'
				} );

				// Enable widget handling on this element
				return toWidgetEditable( widgetElement, viewWriter );
			}
		} );

		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'frontmatter',
			view: {
				name: 'div'
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
				.replace( /\n\\<\\<\\<\n*/g, '---\n\n' ); // Frontmatter end.

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

		model.document.registerPostFixer( writer => {
			const root = model.document.getRoot();

			if ( !root ) {
				return false;
			}

			const frontmatterContainer = root.getChild( 0 );

			if (
				frontmatterContainer &&
				frontmatterContainer.is( 'element', 'frontmatterContainer' )
			) {
				// If the frontmatterContainer is already at the top, no change is needed
				return false;
			}

			const range = model.createRangeIn( root );

			// TODO: rewrite to Differ.
			for ( const value of range.getWalker() ) {
				if ( value.item.is( 'element', 'frontmatterContainer' ) ) {
					const startPosition = model.createPositionAt( root, 0 );

					// Move the frontmatterContainer to the start of the document
					writer.move(
						writer.createRangeOn( value.item ),
						startPosition
					);

					// Indicate that changes were made
					return true;
				}
			}

			// No changes were made
			return false;
		} );
	}
}
