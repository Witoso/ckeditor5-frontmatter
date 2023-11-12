import type { Frontmatter } from './index';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ Frontmatter.pluginName ]: Frontmatter;
	}
}
