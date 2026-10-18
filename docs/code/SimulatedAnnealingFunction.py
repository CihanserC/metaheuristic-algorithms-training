from random import random
import numpy as np


def f(x):
    return (x - 0.3) * (x - 0.3) * (x - 0.3) - 5 * x + x * x - 2


class SimulatedAnnealing:

    # if the cooling rate is large - we consider just a few states in the search space
    # the cooling rate controls the number of states the algorithm will consider
    def __init__(self, min_coordinate, max_coordinate, min_temp, max_temp, cooling_rate=0.02):
        self.min_coordinate = min_coordinate
        self.max_coordinate = max_coordinate
        self.min_temp = min_temp
        self.max_temp = max_temp
        self.cooling_rate = cooling_rate
        self.actual_state = 0
        self.next_state = 0
        self.best_state = 0

    def run(self):

        temp = self.max_temp

        while temp > self.min_temp:
            new_state = self.generate_random_x()

            actual_energy = self.get_energy(self.actual_state)
            new_energy = self.get_energy(new_state)

            if random() < self.accept_prob(actual_energy, new_energy, temp):
                self.actual_state = new_state

            if f(self.actual_state) > f(self.best_state):
                self.best_state = self.actual_state

            temp = temp * (1-self.cooling_rate)

        print('Global maximum: x=%s f(x)=%s' % (self.best_state, f(self.best_state)))

    def generate_random_x(self):
        return self.min_coordinate + (self.max_coordinate - self.min_coordinate) * random()

    @staticmethod
    def accept_prob(actual_energy, next_energy, temp):

        if next_energy > actual_energy:
            return 1

        return np.exp((actual_energy - next_energy) / temp)

    @staticmethod
    def get_energy(x):
        return f(x)


if __name__ == '__main__':
    algorithm = SimulatedAnnealing(-2, 2, 1e-5, 100)
    algorithm.run()
