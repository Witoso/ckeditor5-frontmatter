import { expect } from 'chai';
import * as sinon from 'sinon';

import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import Frontmatter from '../src/frontmatter';
import { Markdown } from '@ckeditor/ckeditor5-markdown-gfm';

describe( 'Frontmatter', () => {
	it( 'should be named', () => {
		expect( Frontmatter.pluginName ).to.equal( 'Frontmatter' );
	} );

	describe( 'init()', () => {
		let domElement: HTMLElement, editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				plugins: [
					Paragraph,
					Heading,
					Essentials,
					Frontmatter,
					Markdown
				],
				toolbar: [ 'frontmatter' ]
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should load Frontmatter', () => {
			const myPlugin = editor.plugins.get( 'Frontmatter' );

			expect( myPlugin ).to.be.an.instanceof( Frontmatter );
		} );

		it( 'should add an icon to the toolbar', () => {
			expect( editor.ui.componentFactory.has( 'frontmatter' ) ).to.equal(
				true
			);
		} );
	} );

	describe( 'editing', () => {
		let domElement: HTMLElement, editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				plugins: [
					Paragraph,
					Heading,
					Essentials,
					Frontmatter,
					Markdown
				],
				toolbar: [ 'frontmatter' ]
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should add an empty frontmatter into the editor after clicking the icon', () => {
			const icon = editor.ui.componentFactory.create( 'frontmatter' );

			expect( editor.getDataWithFrontmatter() ).to.equal( '' );

			icon.fire( 'execute' );

			expect( editor.getDataWithFrontmatter() ).to.equal( '---\n---\n' );
		} );

		it( 'should set/get frontmatter correctly from the data', () => {
			expect( editor.getDataWithFrontmatter() ).to.equal( '' );

			editor.setDataWithFrontmatter(
				'---\ntitle: Title\ndraft: false\n---\n\n## Heading 1'
			);

			expect( editor.getDataWithFrontmatter() ).to.equal(
				'---\ntitle: Title  \ndraft: false\n---\n## Heading 1'
			);
		} );

		it( 'should not be possible to create a second frontmatter', () => {
			editor.setDataWithFrontmatter(
				'---\ndraft: false\n---\n\n## Heading 1'
			);

			expect(
				editor.commands.get( 'insertFrontmatter' )?.isEnabled
			).to.equal( false );
		} );

		it( 'should move frontmatter to the top', () => {
			editor.setDataWithFrontmatter( '## Heading 1' );

			editor.model.change( writer => {
				// Move selection to the end of the document.
				writer.setSelection(
					writer.createPositionAt(
						editor.model.document.getRoot()!,
						'end'
					)
				);

				editor.execute( 'insertFrontmatter' );
			} );

			expect( editor.getDataWithFrontmatter() ).to.equal(
				'---\n---\n## Heading 1'
			);
		} );
	} );

	describe( 'configuration', () => {
		let domElement: HTMLElement, editor: ClassicEditor;
		const fixedDate = new Date( '2023-10-01T00:00:00Z' );
		let clock: sinon.SinonFakeTimers;

		beforeEach( async () => {
			clock = sinon.useFakeTimers( fixedDate.getTime() );

			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				plugins: [
					Paragraph,
					Heading,
					Essentials,
					Frontmatter,
					Markdown
				],
				toolbar: [ 'frontmatter' ],
				frontmatter: new Map(
					[
						[
							'title', ''
						],
						[
							'draft', 'true'
						],
						[
							'date', '$currentDate'
						]
					]
				)
			} );
		} );

		afterEach( () => {
			clock.restore();
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should set/get frontmatter with a predefined config', () => {
			const icon = editor.ui.componentFactory.create( 'frontmatter' );
			icon.fire( 'execute' );

			// The editor is hallucinating spaces a bit, easier to test this way.
			expect( editor.getDataWithFrontmatter() ).to.contain(
				'title:'
			);
			expect( editor.getDataWithFrontmatter() ).to.contain(
				'draft: true'
			);
			expect( editor.getDataWithFrontmatter() ).to.contain(
				'date: 2023-10-01'
			);
		} );
	} );
} );
