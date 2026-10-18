import numpy as np


# Rastrigin function: many local minima, the global minimum is f(0, ..., 0) = 0
def f(position):
    return 10 * len(position) + np.sum(position * position - 10 * np.cos(2 * np.pi * position))


class CMAES:

    # CMA-ES = Covariance Matrix Adaptation Evolution Strategy
    # the search distribution is a multivariate normal N(mean, sigma^2 * C):
    # mean - where we search, sigma - the global step size, C - the shape (orientation) of the search cloud
    def __init__(self, min_x, max_x, dimensions=2, population_size=12, sigma=0.3, max_iteration=80):
        self.min_x = min_x
        self.max_x = max_x
        self.n = dimensions
        self.lam = population_size
        self.sigma = sigma * (max_x - min_x)
        self.max_iteration = max_iteration

        # the selection: only the best mu samples are used and the best of them has the biggest weight
        self.mu = self.lam // 2
        weights = np.log(self.mu + 0.5) - np.log(np.arange(1, self.mu + 1))
        self.weights = weights / weights.sum()
        self.mu_eff = 1 / np.sum(self.weights ** 2)

        # the learning rates of the evolution paths and of the covariance matrix (the default values of the paper)
        n = self.n
        self.cc = (4 + self.mu_eff / n) / (n + 4 + 2 * self.mu_eff / n)
        self.cs = (self.mu_eff + 2) / (n + self.mu_eff + 5)
        self.c1 = 2 / ((n + 1.3) ** 2 + self.mu_eff)
        self.cmu = min(1 - self.c1, 2 * (self.mu_eff - 2 + 1 / self.mu_eff) / ((n + 2) ** 2 + self.mu_eff))
        self.damps = 1 + 2 * max(0, np.sqrt((self.mu_eff - 1) / (n + 1)) - 1) + self.cs
        self.chi_n = np.sqrt(n) * (1 - 1 / (4 * n) + 1 / (21 * n * n))

    def run(self):
        n = self.n
        mean = np.random.uniform(self.min_x, self.max_x, n)
        C = np.eye(n)
        p_sigma = np.zeros(n)
        p_c = np.zeros(n)
        best_x, best_value = mean, float('inf')

        for generation in range(self.max_iteration):
            # eigen decomposition C = B D^2 B^T gives the axes (B) and the lengths (D) of the search ellipse
            eigenvalues, B = np.linalg.eigh(C)
            D = np.sqrt(np.maximum(eigenvalues, 1e-20))

            # 1. sampling: y ~ N(0, C), x = mean + sigma * y
            y = (B @ (D[:, None] * np.random.randn(n, self.lam))).T
            x = np.clip(mean + self.sigma * y, self.min_x, self.max_x)
            values = np.array([f(xi) for xi in x])

            # 2. selection and recombination: the weighted mean of the mu best steps
            order = np.argsort(values)
            y_selected = y[order[:self.mu]]
            y_w = self.weights @ y_selected
            mean = mean + self.sigma * y_w

            if values[order[0]] < best_value:
                best_x, best_value = x[order[0]], values[order[0]]

            # 3. evolution paths: they remember in which direction we have been moving
            c_inv_sqrt = B @ np.diag(1 / D) @ B.T
            p_sigma = (1 - self.cs) * p_sigma + np.sqrt(self.cs * (2 - self.cs) * self.mu_eff) * (c_inv_sqrt @ y_w)
            h_sigma = np.linalg.norm(p_sigma) / np.sqrt(1 - (1 - self.cs) ** (2 * (generation + 1))) / self.chi_n \
                < 1.4 + 2 / (n + 1)
            p_c = (1 - self.cc) * p_c + h_sigma * np.sqrt(self.cc * (2 - self.cc) * self.mu_eff) * y_w

            # 4. covariance matrix adaptation: rank-one update (p_c) + rank-mu update (the selected steps)
            C = (1 - self.c1 - self.cmu) * C \
                + self.c1 * (np.outer(p_c, p_c) + (1 - h_sigma) * self.cc * (2 - self.cc) * C) \
                + self.cmu * (y_selected.T * self.weights) @ y_selected

            # 5. step size control: long paths -> increase sigma, short (back and forth) paths -> decrease it
            self.sigma *= np.exp((self.cs / self.damps) * (np.linalg.norm(p_sigma) / self.chi_n - 1))

        print('Solution: %s with value: %s' % (best_x, best_value))


if __name__ == '__main__':
    algorithm = CMAES(min_x=-5.12, max_x=5.12)
    algorithm.run()
