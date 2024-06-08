import type { DocumentSelection, Element, Model } from 'ckeditor5';

export function isFrontmatterEnd( selection: DocumentSelection ): boolean {
	const range = selection.getFirstRange();
	const positionBefore = selection.getFirstPosition();

	if ( !positionBefore || !range ) {
		return false;
	}

	const nodeBefore = positionBefore.nodeBefore;

	if (
		selection.isCollapsed &&
		range.start.isAtEnd &&
		range.end.isAtEnd &&
		nodeBefore?.is( 'element', 'softBreak' )
	) {
		return true;
	} else {
		return false;
	}
}

export function removeSoftBreakBeforeSelection(
	selection: DocumentSelection,
	model: Model
): void {
	const position = selection.getFirstPosition();
	const nodeBefore = position?.nodeBefore;

	if ( nodeBefore?.is( 'element', 'softBreak' ) ) {
		model.change( writer => {
			writer.remove( nodeBefore );
		} );
	}
}

export function inFrontmatter( selection: DocumentSelection ): boolean {
	const firstPosition = selection.getFirstPosition();
	if ( firstPosition?.findAncestor( 'frontmatter' ) ) {
		return true;
	} else {
		return false;
	}
}

export function findFrontmatterContainer(
	selection: DocumentSelection
): Element | null {
	return selection.getFirstPosition()!.findAncestor( 'frontmatterContainer' );
}
