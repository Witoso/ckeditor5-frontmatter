declare global {
	interface Window {
		editor: ClassicEditor;
	}
}

import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

import {
	Autoformat, Base64UploadAdapter, BlockQuote, Bold, ClassicEditor, Code, CodeBlock,
	Essentials, Heading, Image, ImageCaption, ImageStyle, ImageToolbar, ImageUpload, Indent,
	Italic, Link, List, Markdown, MediaEmbed, Paragraph, Table, TableToolbar } from 'ckeditor5';

import type GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor.js';

import Frontmatter from '../src/frontmatter.js';

import 'ckeditor5/ckeditor5.css';
import '../dist/index.css';

ClassicEditor.create( document.getElementById( 'editor' )!, {
	placeholder: 'Start writing...',
	plugins: [
		Frontmatter,
		Markdown,
		Essentials,
		Autoformat,
		BlockQuote,
		Bold,
		Heading,
		Image,
		ImageCaption,
		ImageStyle,
		ImageToolbar,
		ImageUpload,
		Indent,
		Italic,
		Link,
		List,
		MediaEmbed,
		Paragraph,
		Table,
		TableToolbar,
		CodeBlock,
		Code,
		Base64UploadAdapter
	],
	toolbar: [
		'frontmatter',
		'|',
		'heading',
		'|',
		'bold',
		'italic',
		'link',
		'code',
		'bulletedList',
		'numberedList',
		'|',
		'outdent',
		'indent',
		'|',
		'uploadImage',
		'blockQuote',
		'insertTable',
		'mediaEmbed',
		'codeBlock',
		'|',
		'undo',
		'redo'
	],
	image: {
		toolbar: [
			'imageStyle:inline',
			'imageStyle:block',
			'imageStyle:side',
			'|',
			'imageTextAlternative'
		]
	},
	table: {
		contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
	}
} )
	.then( editor => {
		window.editor = editor;
		const gfm = editor.data.processor as GFMDataProcessor;
		gfm.keepHtml( 'div' );
		CKEditorInspector.attach( editor );
		window.console.log( 'CKEditor 5 is ready.', editor );

		editor.getDataWithFrontmatter();
	} )
	.catch( err => {
		window.console.error( err.stack );
	} );
