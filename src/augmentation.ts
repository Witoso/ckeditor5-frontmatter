import type { FrontmatterConfig } from './frontmatterconfig';
import type { Frontmatter } from './index';
import type InsertFrontmatterCommand from './insertfrontmattercommand';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[Frontmatter.pluginName]: Frontmatter;
	}

	interface CommandsMap {
		insertFrontmatter: InsertFrontmatterCommand;
	}

	interface Editor {
		setDataWithFrontmatter: ( data: string ) => void;
		getDataWithFrontmatter: () => string;
	}

	interface EditorConfig {
		frontmatter?: FrontmatterConfig;
	}
}
