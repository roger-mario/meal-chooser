"use client";

/** Opens Bring!, which reads the meal's ingredients from our public page and asks which list to add them to. */
export function BringButton({ token, servings }: { token: string; servings: number }) {
  function open() {
    const params = new URLSearchParams({
      url: `${window.location.origin}/api/bring/${token}`,
      source: "web",
      baseQuantity: String(servings),
      requestedQuantity: String(servings),
    });
    window.location.href = `https://api.getbring.com/rest/bringrecipes/deeplink?${params}`;
  }

  return (
    <button type="button" className="btn" onClick={open} title="Add the ingredients (without basics like salt or oil) to a Bring! list">
      🛒
      <span className="sm:hidden">Bring!</span>
      <span className="hidden sm:inline">Add to Bring!</span>
    </button>
  );
}
