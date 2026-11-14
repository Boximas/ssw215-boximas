import unicodedata


def normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value.strip().lower())
    without_accents = "".join(
        character
        for character in decomposed
        if unicodedata.category(character) != "Mn"
    )
    without_punctuation = "".join(
        " " if unicodedata.category(character).startswith("P") else character
        for character in without_accents
    )
    return " ".join(without_punctuation.split())


def check_guess(guess: str, figure: dict) -> bool:
    normalized_guess = normalize(guess)
    normalized_name = normalize(figure["name"])
    surname = normalized_name.split()[-1]
    aliases = [normalize(alias) for alias in figure["aliases"]]
    return normalized_guess in {normalized_name, surname, *aliases}
