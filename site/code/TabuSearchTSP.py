from math import sqrt
from random import random
from random import shuffle


class City:

    def __init__(self):
        self.x = 1000 * random()
        self.y = 1000 * random()


def distance(city1, city2):
    return sqrt((city1.x - city2.x) ** 2 + (city1.y - city2.y) ** 2)


def tour_distance(tour):
    return sum(distance(tour[i], tour[(i + 1) % len(tour)]) for i in range(len(tour)))


class TabuSearch:

    # tenure: how many iterations a move stays forbidden (the length of the tabu "memory")
    # a short tenure -> the search may cycle, a long tenure -> the search is forced to explore
    def __init__(self, num_cities, tenure=8, max_iteration=150):
        self.tenure = tenure
        self.max_iteration = max_iteration
        self.actual_state = [City() for _ in range(num_cities)]
        shuffle(self.actual_state)
        self.best_state = self.actual_state[:]
        # tabu[(a, b)] = the iteration until which swapping the cities a and b is forbidden
        self.tabu = {}

    def run(self):
        print('Initial (random) distance: %sm' % round(tour_distance(self.actual_state), 3))

        for iteration in range(self.max_iteration):
            best_neighbor = None
            best_distance = float('inf')
            best_move = None

            # we examine the WHOLE neighborhood: every possible swap of 2 cities
            for i in range(len(self.actual_state) - 1):
                for j in range(i + 1, len(self.actual_state)):
                    neighbor = self.actual_state[:]
                    neighbor[i], neighbor[j] = neighbor[j], neighbor[i]
                    dist = tour_distance(neighbor)
                    move = (id(self.actual_state[i]), id(self.actual_state[j]))

                    # aspiration criterion: a tabu move is allowed if it gives a new global best
                    if self.is_tabu(move, iteration) and dist >= tour_distance(self.best_state):
                        continue

                    if dist < best_distance:
                        best_neighbor, best_distance, best_move = neighbor, dist, move

            if best_neighbor is None:
                continue

            # we move to the best neighbor EVEN IF it is worse than the current state
            # (this is how tabu search climbs out of local optima)
            self.actual_state = best_neighbor
            self.tabu[best_move] = iteration + self.tenure
            self.tabu[best_move[::-1]] = iteration + self.tenure

            if best_distance < tour_distance(self.best_state):
                self.best_state = self.actual_state[:]

        print('Solution: %sm' % round(tour_distance(self.best_state), 3))

    def is_tabu(self, move, iteration):
        return self.tabu.get(move, -1) > iteration


if __name__ == '__main__':
    algorithm = TabuSearch(15)
    algorithm.run()
