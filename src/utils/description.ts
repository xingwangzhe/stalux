import removeMd from "remove-markdown";

export function description150(description: string): string {
	const plainText = removeMd(description || "")
		.replace(/\s+/g, " ")
		.trim();
	if (plainText.length > 150) {
		return plainText.slice(0, 145) + "...";
	}
	return plainText;
}