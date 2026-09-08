def competition_ranks(scores: list[float]) -> list[int]:
    sorted_scores = sorted(scores, reverse=True)
    ranks = []
    prev = None
    rank = 0
    for idx, score in enumerate(sorted_scores, start=1):
        if prev is None or score != prev:
            rank = idx
        ranks.append(rank)
        prev = score
    return ranks


def test_competition_ranking_with_ties():
    assert competition_ranks([95, 95, 90, 82]) == [1, 1, 3, 4]
    assert competition_ranks([95, 90, 90, 90, 80]) == [1, 2, 2, 2, 5]
