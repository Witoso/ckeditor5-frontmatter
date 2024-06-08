import { Plugin } from 'ckeditor5';
import FrontmatterEditing from './frontmatterediting.js';
import FrontmatterUI from './frontmatterui.js';

export default class Frontmatter extends Plugin {
	public static get pluginName() {
		return 'Frontmatter' as const;
	}

	public static get requires() {
		return [ 'Markdown', FrontmatterEditing, FrontmatterUI ] as const;
	}
}
