import { expect } from 'chai';
import { Frontmatter as FrontmatterDll, icons } from '../src';
import Frontmatter from '../src/frontmatter';

import ckeditor from './../theme/icons/ckeditor.svg';

describe( 'CKEditor5 Frontmatter DLL', () => {
	it( 'exports Frontmatter', () => {
		expect( FrontmatterDll ).to.equal( Frontmatter );
	} );

	describe( 'icons', () => {
		it( 'exports the "ckeditor" icon', () => {
			expect( icons.ckeditor ).to.equal( ckeditor );
		} );
	} );
} );
