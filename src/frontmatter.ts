import { Plugin } from 'ckeditor5/src/core';
import FrontmatterEditing from './frontmatterediting';
import FrontmatterUI from './frontmatterui';

export default class Frontmatter extends Plugin {
	public static get pluginName() {
		return 'Frontmatter' as const;
	}

	public static get requires() {
		return [ 'Markdown', FrontmatterEditing, FrontmatterUI ] as const;
	}
}
