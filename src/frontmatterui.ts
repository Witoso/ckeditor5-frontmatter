import { ButtonView } from 'ckeditor5/src/ui';
import { Plugin } from 'ckeditor5/src/core';
import type InsertFrontmatterCommand from './insertfrontmattercommand';
import frontmatterIcon from '../theme/icons/frontmatter.svg';

import '../theme/frontmatter.css';

export default class FrontmatterUI extends Plugin {
	public init(): void {
		const editor = this.editor;
		const t = editor.t;

		editor.ui.componentFactory.add( 'frontmatter', locale => {
			const command: InsertFrontmatterCommand =
				editor.commands.get( 'insertFrontmatter' )!;

			const buttonView = new ButtonView( locale );

			buttonView.set( {
				label: t( 'Frontmatter' ),
				icon: frontmatterIcon,
				tooltip: true
			} );

			buttonView
				.bind( 'isOn', 'isEnabled' )
				.to( command, 'value', 'isEnabled' );

			// Execute the command when the button is clicked (executed).
			this.listenTo( buttonView, 'execute', () =>
				editor.execute( 'insertFrontmatter' )
			);

			return buttonView;
		} );
	}
}
