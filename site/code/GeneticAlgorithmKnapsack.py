from random import uniform
from numpy.random import randint

TOURNAMENT_SIZE = 10
CAPACITY = 8
CHROMOSOME_LENGTH = 4


class Individual:

    def __init__(self, weights, values):
        self.genes = [randint(0, 2) for _ in range(len(values))]
        self.weights = weights
        self.values = values

    def get_fitness(self):

        weight = 0
        value = 0

        for index, gene in enumerate(self.genes):
            if gene == 1:
                weight += self.weights[index]
                value += self.values[index]

        if weight <= CAPACITY:
            return value

        return -float('inf')

    def set_gene(self, index, value):
        self.genes[index] = value

    def __repr__(self):
        return ''.join(str(e) for e in self.genes)


class Population:

    def __init__(self, population_size, weights, values):
        self.weights = weights
        self.values = values
        self.population_size = population_size
        self.individuals = [Individual(weights, values) for _ in range(population_size)]

    def get_fittest(self):

        fittest = self.individuals[0]

        for individual in self.individuals[1:]:
            if individual.get_fitness() > fittest.get_fitness():
                fittest = individual

        return fittest

    def get_fittest_elitism(self, n):
        self.individuals.sort(key=lambda ind: ind.get_fitness(), reverse=True)
        return self.individuals[:n]

    def get_size(self):
        return self.population_size

    def get_individual(self, index):
        return self.individuals[index]

    def save_individual(self, index, individual):
        self.individuals[index] = individual


class GeneticAlgorithm:

    def __init__(self, weights, values, population_size=100, crossover_rate=0.65, mutation_rate=0.1, elitism_param=5):
        self.weights = weights
        self.values = values
        self.population_size = population_size
        self.crossover_rate = crossover_rate
        self.mutation_rate = mutation_rate
        self.elitism_param = elitism_param

    def run(self):

        pop = Population(self.population_size, self.weights, self.values)
        generation_counter = 0

        while generation_counter < 100:
            generation_counter += 1
            print('Generation #%s - fittest is: %s with fitness value %s' % (
                generation_counter, pop.get_fittest(), pop.get_fittest().get_fitness()))
            pop = algorithm.evolve_population(pop)

        print('Solution found...')
        print(pop.get_fittest())

    def evolve_population(self, population):

        next_population = Population(self.population_size, self.weights, self.values)

        # elitism: the top fittest individuals from previous population survive
        # so we copy the top 5 individuals to the next iteration (next population)
        # in this case the population fitness can not decrease during the iterations
        next_population.individuals.extend(population.get_fittest_elitism(self.elitism_param))

        # crossover
        for index in range(self.elitism_param, next_population.get_size()):
            first = self.random_selection(population)
            second = self.random_selection(population)
            next_population.save_individual(index, self.crossover(first, second))

        # mutation
        for individual in next_population.individuals:
            self.mutate(individual)

        return next_population

    def crossover(self, offspring1, offspring2):
        cross_individual = Individual(self.weights, self.values)

        start = randint(CHROMOSOME_LENGTH)
        end = randint(CHROMOSOME_LENGTH)

        if start > end:
            start, end = end, start

        cross_individual.genes = offspring1.genes[:start] + offspring2.genes[start:end] + offspring1.genes[end:]

        return cross_individual

    def mutate(self, individual):
        for index in range(CHROMOSOME_LENGTH):
            if uniform(0, 1) <= self.mutation_rate:
                individual.genes[index] = randint(0, 2)

    # this is called tournament selection
    def random_selection(self, actual_population):

        new_population = Population(TOURNAMENT_SIZE, self.weights, self.values)

        for i in range(new_population.get_size()):
            random_index = randint(new_population.get_size())
            new_population.save_individual(i, actual_population.get_individual(random_index))

        return new_population.get_fittest()


if __name__ == '__main__':

    w = [2, 3, 4, 5]
    v = [1, 2, 5, 6]

    algorithm = GeneticAlgorithm(w, v, 50, 0.85, 0.015)
    algorithm.run()

