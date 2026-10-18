from math import sqrt
from random import random
from random import randint


class City:

    def __init__(self):
        self.x = 1000 * random()
        self.y = 1000 * random()


def distance(city1, city2):
    return sqrt((city1.x - city2.x) ** 2 + (city1.y - city2.y) ** 2)


class AntColonyOptimization:

    # alpha: importance of the pheromone trail (the "memory" of the colony)
    # beta: importance of the heuristic information (1/distance - prefer close cities)
    # rho: evaporation rate - the pheromone slowly disappears so bad paths are forgotten
    # q: the amount of pheromone an ant deposits (divided by the length of its tour)
    def __init__(self, num_cities, num_ants=15, alpha=1.0, beta=4.0, rho=0.4, q=500, max_iteration=80):
        self.cities = [City() for _ in range(num_cities)]
        self.num_ants = num_ants
        self.alpha = alpha
        self.beta = beta
        self.rho = rho
        self.q = q
        self.max_iteration = max_iteration
        n = num_cities
        self.pheromone = [[1.0] * n for _ in range(n)]
        self.dist = [[distance(a, b) + 1e-9 for b in self.cities] for a in self.cities]
        self.best_tour = None
        self.best_length = float('inf')

    def run(self):

        for iteration in range(self.max_iteration):
            tours = [self.construct_tour() for _ in range(self.num_ants)]

            for tour in tours:
                length = self.tour_length(tour)
                if length < self.best_length:
                    self.best_length = length
                    self.best_tour = tour

            self.update_pheromone(tours)

        print('Solution: %sm' % round(self.best_length, 3))

    # every ant builds a tour city by city: the next city is chosen at random but with a probability
    # proportional to pheromone^alpha * (1/distance)^beta (roulette wheel selection)
    def construct_tour(self):
        n = len(self.cities)
        tour = [randint(0, n - 1)]
        visited = {tour[0]}

        while len(tour) < n:
            current = tour[-1]
            weights = [0.0 if j in visited else
                       (self.pheromone[current][j] ** self.alpha) * ((1 / self.dist[current][j]) ** self.beta)
                       for j in range(n)]
            r = random() * sum(weights)

            for j, w in enumerate(weights):
                r -= w
                if w > 0 and r <= 0:
                    break

            tour.append(j)
            visited.add(j)

        return tour

    def update_pheromone(self, tours):
        n = len(self.cities)

        # evaporation
        for i in range(n):
            for j in range(n):
                self.pheromone[i][j] *= (1 - self.rho)

        # deposit: shorter tours leave more pheromone on their edges
        for tour in tours:
            deposit = self.q / self.tour_length(tour)
            for i in range(n):
                a, b = tour[i], tour[(i + 1) % n]
                self.pheromone[a][b] += deposit
                self.pheromone[b][a] += deposit

    def tour_length(self, tour):
        return sum(self.dist[tour[i]][tour[(i + 1) % len(tour)]] for i in range(len(tour)))


if __name__ == '__main__':
    algorithm = AntColonyOptimization(15)
    algorithm.run()
