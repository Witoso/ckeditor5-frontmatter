import { expect } from 'chai';
import * as sinon from 'sinon';

import Frontmatter from '../src/frontmatter.js';
import { ClassicEditor, Essentials, Heading, Markdown, Paragraph } from 'ckeditor5';

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

		it( 'empty frontmatter and editor will return empty', () => {
			const icon = editor.ui.componentFactory.create( 'frontmatter' );

			expect( editor.getDataWithFrontmatter() ).to.equal( '' );

			icon.fire( 'execute' );

			const expected = '';

			expect( editor.getDataWithFrontmatter() ).to.equal( expected );
		} );

		it( 'should set/get frontmatter correctly from the data', () => {
			expect( editor.getDataWithFrontmatter() ).to.equal( '' );

			editor.setDataWithFrontmatter(
				'---\ntitle: Title\ndraft: false\n---\n\n## Heading 1'
			);

			expect( editor.getDataWithFrontmatter() ).to.equal(
				'---\ntitle: Title\ndraft: false\n---\n\n## Heading 1'
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
				'---\n\u00A0\n---\n\n## Heading 1'
			);
		} );

		it( 'should be symmetrical', () => {
			expect( editor.getDataWithFrontmatter() ).to.equal( '' );

			const content =
				'---\ntitle: Title\ndraft: false\n---\n\n## Heading 1.';

			editor.setDataWithFrontmatter( content );

			expect( editor.getDataWithFrontmatter() ).to.equal( content );

			editor.setDataWithFrontmatter( editor.getDataWithFrontmatter() );
			expect( editor.getDataWithFrontmatter() ).to.equal( content );
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
				frontmatter: new Map( [
					[ 'title', '' ],
					[ 'draft', 'true' ],
					[ 'date', '$currentDate' ]
				] )
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

			// The test runner has some problem with spaces comparision.
			expect( editor.getDataWithFrontmatter() ).to.contain( 'title:' );
			expect( editor.getDataWithFrontmatter() ).to.contain( 'draft: true' );
			expect( editor.getDataWithFrontmatter() ).to.contain(
				'date: 2023-10-01'
			);
		} );
	} );
} );
