from random import random, randint

# the hidden solution we are looking for
TARGET = [randint(0, 1) for _ in range(24)]


def fitness(genes):
    return sum(1 for gene, target in zip(genes, TARGET) if gene == target)


class PBIL:

    # PBIL = Population-Based Incremental Learning
    # there is NO population of individuals that evolves: we only keep a probability vector
    # probabilities[i] = the probability of the i-th bit to be 1 (initially 0.5 = we know nothing)
    def __init__(self, length=24, sample_size=30, learning_rate=0.1, mutation_rate=0.02, mutation_shift=0.05,
                 max_generation=200):
        self.length = length
        self.sample_size = sample_size
        self.learning_rate = learning_rate
        self.mutation_rate = mutation_rate
        self.mutation_shift = mutation_shift
        self.max_generation = max_generation
        self.probabilities = [0.5] * length

    def run(self):

        for generation in range(self.max_generation):
            # 1. sampling: generate candidate solutions from the probability vector
            samples = [self.sample() for _ in range(self.sample_size)]
            best = max(samples, key=fitness)

            print('Generation #%s - fittest has fitness value %s' % (generation, fitness(best)))

            if fitness(best) == self.length:
                break

            for i in range(self.length):
                # 2. learning: move the probabilities towards the best sample
                self.probabilities[i] = self.probabilities[i] * (1 - self.learning_rate) \
                                        + best[i] * self.learning_rate

                # 3. mutation of the probability vector keeps the exploration alive
                if random() < self.mutation_rate:
                    self.probabilities[i] = self.probabilities[i] * (1 - self.mutation_shift) \
                                            + randint(0, 1) * self.mutation_shift

        print('Solution found...')
        print(''.join(str(round(p)) for p in self.probabilities))

    def sample(self):
        return [1 if random() < p else 0 for p in self.probabilities]


if __name__ == '__main__':
    algorithm = PBIL()
    algorithm.run()
