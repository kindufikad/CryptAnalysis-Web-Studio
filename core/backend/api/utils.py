from collections import Counter
import re


_ENGLISH_FREQUENCIES = {
    "a": 8.167, "b": 1.492, "c": 2.782, "d": 4.253, "e": 12.702,
    "f": 2.228, "g": 2.015, "h": 6.094, "i": 6.966, "j": 0.153,
    "k": 0.772, "l": 4.025, "m": 2.406, "n": 6.749, "o": 7.507,
    "p": 1.929, "q": 0.095, "r": 5.987, "s": 6.327, "t": 9.056,
    "u": 2.758, "v": 0.978, "w": 2.360, "x": 0.150, "y": 1.974,
    "z": 0.074,
}
_COMMON_ENGLISH_WORDS = frozenset(
    "a about after all also an and any are as at be because been before being "
    "between both but by can could day did do each even first for from get "
    "go good had has have he her here him his how i if in into is it its just "
    "know like look make many me more most my new no not now of on one only "
    "or other our out over people said same see she so some than that the "
    "their them then there these they this time to two up use very was we "
    "well were what when which who will with would you your hello world"
    .split()
)


def caesar_brute_force(ciphertext: str) -> list[dict[str, int | str]]:
    """Return plaintext candidates for every Caesar key from 0 through 25."""
    candidates = []

    for shift in range(26):
        plaintext = []
        for character in ciphertext:
            if "A" <= character <= "Z":
                base = ord("A")
            elif "a" <= character <= "z":
                base = ord("a")
            else:
                plaintext.append(character)
                continue

            offset = (ord(character) - base - shift) % 26
            plaintext.append(chr(base + offset))

        candidates.append({"shift": shift, "plaintext": "".join(plaintext)})

    return candidates


def _english_frequency_score(text: str) -> float:
    counts = frequency_analysis(text)
    total = sum(counts.values())
    if not total:
        return float("inf")

    return sum(
        ((counts.get(letter, 0) * 100 / total - expected) ** 2) / expected
        for letter, expected in _ENGLISH_FREQUENCIES.items()
    )


def _common_word_score(text: str) -> int:
    return sum(
        len(word)
        for word in re.findall(r"[a-z]+", text.lower())
        if word in _COMMON_ENGLISH_WORDS
    )


def crack_caesar(
    ciphertext: str,
    *,
    allow_zero_shift: bool = False,
) -> dict[str, int | str | dict[str, int] | list[dict[str, int | str]]]:
    """Return the best-scored guess and all shifts, excluding key 0 by default."""
    candidates = caesar_brute_force(ciphertext)

    def candidate_score(candidate: dict[str, int | str]) -> tuple[int, float]:
        plaintext = candidate["plaintext"]
        return (
            _common_word_score(plaintext),
            -_english_frequency_score(plaintext),
        )

    eligible_candidates = candidates if allow_zero_shift else candidates[1:]
    best_candidate = max(eligible_candidates, key=candidate_score)
    confidence = "high" if _common_word_score(best_candidate["plaintext"]) >= 3 else "low"

    return {
        "likely_plaintext": best_candidate["plaintext"],
        "plaintext": best_candidate["plaintext"],
        "shift": best_candidate["shift"],
        "confidence": confidence,
        "candidates": candidates,
        "letter_frequencies": frequency_analysis(best_candidate["plaintext"]),
    }


def frequency_analysis(text: str) -> dict[str, int]:
    """Count ASCII letters case-insensitively, ordered by descending frequency."""
    counts = Counter(character.lower() for character in text if "a" <= character.lower() <= "z")
    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0])))
