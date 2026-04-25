import { App, TFile, TFolder } from 'obsidian';

/**
 * Minimal contract for the folder-notes plugin's public API.
 * Mirrored here to avoid a build-time dependency on folder-notes.
 * See: https://github.com/LostPaul/obsidian-folder-notes/blob/main/src/api.ts
 */
interface FolderNotesApi {
	version: string;
	getEnabledFolderNote(folderPath: string): TFile | null;
}

/**
 * Resolves a folder path to its associated folder-note TFile, or null if
 * no associated note exists. Never returns a TFile whose relationship to
 * the folder is only incidental (e.g. same-basename file elsewhere in the
 * vault).
 *
 * Resolution order:
 *   1. folder-notes plugin API (authoritative; respects user's exclusions)
 *   2. Canonical convention `<folderPath>/<folderName>.md`
 *   3. null
 *
 * Only the exact canonical path is checked as fallback — intentionally NOT
 * Obsidian's linkpath resolver, because linkpath falls back to basename
 * matching across the entire vault, which produces false positives (e.g.
 * folder "Inbox" resolving to an unrelated "Inbox.md" at vault root).
 */
export function resolveFolderNoteDest(app: App, path: string): TFile | null {
	const abstract = app.vault.getAbstractFileByPath(path);
	if (!(abstract instanceof TFolder)) return null;

	// Priority 1: folder-notes API
	const folderNotesApi = (app as any).plugins?.plugins?.['folder-notes']
		?.api as FolderNotesApi | undefined;
	if (folderNotesApi?.getEnabledFolderNote) {
		const fromApi = folderNotesApi.getEnabledFolderNote(abstract.path);
		if (fromApi instanceof TFile) return fromApi;
	}

	// Priority 2: canonical Obsidian convention
	const canonicalPath = `${abstract.path}/${abstract.name}.md`;
	const canonical = app.vault.getAbstractFileByPath(canonicalPath);
	if (canonical instanceof TFile) return canonical;

	return null;
}
