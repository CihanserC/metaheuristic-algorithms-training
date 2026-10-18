import numpy as np
from copy import deepcopy
from random import randint
from random import random
from random import sample

TABLE_SIZE = 9
BOX_SIZE = 3


# a single solution (configuration)
class SingleSolution:

    def __init__(self, table):
        self.table = deepcopy(table)
        self.original_table = deepcopy(table)

    # we have to generate random integers for the empty cells
    def generate_solution(self):
        for row_index in range(0, TABLE_SIZE, 3):
            for col_index in range(0, TABLE_SIZE, 3):
                row_offset = (row_index // 3) * BOX_SIZE
                col_offset = (col_index // 3) * BOX_SIZE

                nums = [n for n in range(1, 10)]

                # there are some constants already present in the actual BOX
                # we have to get rid of these values from the nums
                for i in range(BOX_SIZE):
                    for j in range(BOX_SIZE):
                        if self.table[row_offset+i][col_offset+j] != 0:
                            nums.remove(self.table[row_offset + i][col_offset + j])

                # insert the values into the empty cells
                for i in range(BOX_SIZE):
                    for j in range(BOX_SIZE):
                        if self.table[row_offset + i][col_offset + j] == 0:
                            self.table[row_offset + i][col_offset + j] = nums.pop()

    def mutate(self):
        row_offset = (randint(0, TABLE_SIZE-1) // BOX_SIZE) * BOX_SIZE
        col_offset = (randint(0, TABLE_SIZE - 1) // BOX_SIZE) * BOX_SIZE

        indexes = []

        for i in range(BOX_SIZE):
            for j in range(BOX_SIZE):
                if self.original_table[row_offset + i][col_offset + j] != 0:
                    indexes.append([row_offset + i, col_offset + j])

        pair1, pair2 = sample(indexes, 2)
        self.table[pair1[0]][pair1[1]], self.table[pair2[0]][pair2[1]] = \
            self.table[pair2[0]][pair2[1]], self.table[pair1[0]][pair1[1]]

    # calculates the number of collisions (penalties)
    # we are looking for lower fitness values
    def fitness(self):

        penalty = 0

        # check all the rows
        for row in range(TABLE_SIZE):
            penalty += (len(self.table[row]) - len(set(self.table[row])))

        # we have to apply it on the columns
        # matrix transpose operation
        transposed_table = list(zip(*self.table))

        for row in range(TABLE_SIZE):
            penalty += (len(transposed_table[row]) - len(set(transposed_table[row])))

        return penalty

    def __repr__(self):
        return '\n'.join(['\t'.join([str(cell) for cell in row]) for row in self.table])


class SimulatedAnnealing:

    def __init__(self, table, min_temp, max_temp, cooling_rate=0.999):
        self.table = table
        self.min_temp = min_temp
        self.max_temp = max_temp
        self.cooling_rate = cooling_rate
        self.actual_state = SingleSolution(table)
        self.best_state = self.actual_state
        self.next_state = None

    def run(self):
        self.actual_state.generate_solution()
        temp = self.max_temp
        counter = 0

        while temp > self.min_temp and self.best_state.fitness() != 0:
            counter += 1

            if counter % 100 == 0:
                print('Iteration #%s - penalty: %s' % (counter, self.best_state.fitness()))

            new_state = self.generate_next_state(self.actual_state)

            actual_energy = self.actual_state.fitness()
            new_energy = new_state.fitness()

            if random() < self.accept_prob(actual_energy, new_energy, temp):
                self.actual_state = new_state

            if self.actual_state.fitness() < self.best_state.fitness():
                self.best_state = self.actual_state

            temp = temp * self.cooling_rate

        print('Solution: \n%s' % self.best_state)

    # swap 2 non-constant items in a single box at random
    @staticmethod
    def generate_next_state(actual_state):
        new_state = SingleSolution(actual_state.table)
        new_state.mutate()
        return new_state

    @staticmethod
    def accept_prob(actual_energy, next_energy, temp):
        # the number of penalty is smaller for the next state
        if next_energy < actual_energy:
            return 1

        return np.exp((actual_energy - next_energy) / temp)


if __name__ == '__main__':
    sudoku_table = [[3, 0, 6, 5, 0, 8, 4, 0, 0],
                    [5, 2, 0, 0, 0, 0, 0, 0, 0],
                    [0, 8, 7, 0, 0, 0, 0, 3, 1],
                    [0, 0, 3, 0, 1, 0, 0, 8, 0],
                    [9, 0, 0, 8, 6, 3, 0, 0, 5],
                    [0, 5, 0, 0, 9, 0, 6, 0, 0],
                    [1, 3, 0, 0, 0, 0, 2, 5, 0],
                    [0, 0, 0, 0, 0, 0, 0, 7, 4],
                    [0, 0, 5, 2, 0, 6, 3, 0, 0]
                    ]

    a = SimulatedAnnealing(sudoku_table, 1e-2, 1e4)
    a.run()







