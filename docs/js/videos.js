/* Hand-picked YouTube explainers per page (all <= 15 min, public and embeddable at the time of selection).
   Each entry: [videoId, channel, title, optional note]. */
(function () {
  'use strict';
  const NOTE_SA = { tr: 'Bu yönteme özel kısa bir video bulunamadı; fikrin kökü olan Tavlama Benzetimi anlatılıyor (kabul-eşiği mantığı aynı ailedendir).', en: 'No short video dedicated to this method was found; this explains Simulated Annealing, the root of the same acceptance-threshold idea.' };
  const NOTE_CEM = { tr: 'Çapraz Entropi Yöntemi\'nin örnekleme + elit seçimi fikri, robotik planlamada CEM olarak anlatılıyor.', en: 'The sampling + elite-selection idea of the Cross-Entropy Method, explained as CEM in robot planning.' };
  const V = {
    'sa-function': [['Dp1irQX-c0Q', 'Udacity', 'Simulated Annealing – Georgia Tech Machine Learning'], ['80_dLA4JY3o', 'Charlotte Moser', 'Simulated Annealing: A Stochastic Optimization Method']],
    'sa-tsp': [['I_0GBWCKft8', 'SciShow', 'The Most Metal Algorithm in Computer Science'], ['NPE3zncXA5s', 'ComputationalScientist', 'Simulated Annealing Visualization: Solving the Travelling Salesman Problem']],
    'sa-sudoku': [['FyyVbuLZav8', 'Challenging Luck', 'Simulated Annealing Explained By Solving Sudoku'], ['E8tkpzDne7I', 'Arianna Ingalls', 'Simulated Annealing and Sudoku']],
    'ga-sequence': [['uQj5UNhCPuo', 'Kie Codes', 'Genetic Algorithms Explained By Example'], ['-kpcAa-qKwY', 'The Programming Piglet', 'Genetic algorithms explained in 6 minutes']],
    'ga-knapsack': [['MacVqujSXWE', 'Computerphile', 'The Knapsack Problem & Genetic Algorithms']],
    'ga-nqueens': [['TgftP7Qy0jk', 'Wealth Wizards Engineering', 'Using Genetic Algorithms to Solve N-Queens'], ['QXn27pUyuNQ', 'Will Knipe', 'N-Queens Genetic Algorithm']],
    'pso': [['bFbJhl9W89Q', 'b001', 'How Swarms Solve Impossible Problems'], ['ib56kL9ovnQ', 'Intuition point', 'Particle Swarm Optimization (PSO) Explained Visually']],
    'hill-climbing': [['oSdPmxRCWws', 'Computerphile', 'Hill Climbing Algorithm & Artificial Intelligence'], ['kOFBnKDGtJM', 'Udacity', 'Hill Climbing – Georgia Tech Machine Learning']],
    'tabu-search': [['tIDhFPhrCbU', 'Computer Monk', 'Tabu search introduction'], ['saNk8h2KuVE', 'Computer Monk', 'Tabu search introduction II']],
    'aco': [['xGlzOSt9Pjk', 'BrainSlam', 'This Is How Ants Find The Shortest Way To Food (Ant Colony Optimization)'], ['oXb2nC-e_EA', 'Himangshu Saikia', 'Solving the Travelling Salesman Problem using Ant Colony Optimization']],
    'diff-evolution': [['klmkHsHJLoM', 'Krishn Mishra', 'Differential Evolution Algorithm'], ['YPn6yZ503DE', 'StudyWithAI by Ranjan', 'Differential Evolution (DE) Explained: Algorithm + Intuition']],
    'abc': [['K2Cbmug8cvY', 'neoblackcyptron', 'Artificial Bee Colony Optimization'], ['3qQr1eZwz5E', 'JCOp Untuk Indonesia', 'Artificial Bee Colony (ABC) Visualized']],
    'gwo': [['IKxilEztZz8', 'Paulo Moura Oliveira', 'Grey Wolf Optimization – Introduction and some issues'], ['09lu95yHYi8', 'Nasima Dadgar', 'Grey Wolf Optimization (GWO) vs Particle Swarm Optimization (PSO)']],
    'ils': [['Vye39FMb5vo', 'INSTICC · Prof. Helena R. Lourenço', 'Iterated Local Search: Applications and Extensions'], ['JehM7ZuCW5s', 'Sigma Notation', 'Tabu Search vs Iterative Local Search in 5 Minutes']],
    'vns': [['yL3jIX3XnWY', 'Albert Einstein Muritiba', 'VNS – Variable Neighborhood Search'], ['kyniSaideGA', 'T V Nagaraju Technical', 'Variable Neighbourhood Descent (VND) Algorithm']],
    'great-deluge': [['M0ZifrXkbjs', 'The Code Bit', 'Simulated Annealing Explainer', NOTE_SA]],
    'threshold-accepting': [['S9vs05eAGN0', 'Eric Schirtzinger', 'Simulated Annealing – An Artificial Intelligence Optimization Algorithm', NOTE_SA]],
    'grasp': [['dgKe06K_hlc', 'Carlos García-Martínez', 'GRASP'], ['ju_A9hHhjDo', 'Albert Einstein Muritiba', 'GRASP – Greedy Randomized Adaptive Search Procedure']],
    'memetic': [['X5hvluqlv5w', 'Solving Optimization Problem', 'Memetic Algorithm in Python'], ['3U3dhg7AOdk', 'tmtyler', 'Tim Tyler: Memetic algorithms']],
    'cmaes': [['5qCAOyNJROg', 'CabbageCat', 'Simple evolution strategy (ES) and covariance adaptation'], ['t00qldrWXh8', 'Tutorials Collection', 'Covariance Matrix Adaptation Evolution Strategy CMA-ES']],
    'pbil': [['QPDIZJbgfwA', 'Udacity', 'Estimating Distributions – Georgia Tech Machine Learning'], ['je7WROMXMnE', 'pdsunal', 'Population Based Incremental Learning vs. Evolutionary Algorithm']],
    'cross-entropy': [['ncr9tLyenlY', 'Agents Explained', 'Sampling-Based MPC Explained: CEM, MPPI & iCEM', NOTE_CEM]],
    'firefly': [['5VdHEYVAvbs', 'gd33rd', 'Ever heard of the "Firefly Algorithm"?'], ['LPKg_luHxpc', 'JCOp Untuk Indonesia', 'Firefly Algorithm (FA) Visualized']],
    'cuckoo': [['BmZq1hi9eQg', 'Decoderz', 'Cuckoo Search Optimization Algorithm – AI Tutorial'], ['mFlR2e5vI7Q', 'Tarik Rashid', 'Cuckoo Search Algorithm: Concepts, Lévy Flights & Principles']],
    'bat': [['-nJWI0Y1DLY', 'D Sumathi', 'Bat Algorithm BA']],
    'woa': [['BFOTdUy2TsQ', 'Research Potential', 'Whale Optimization Algorithm (WOA)']],
    'hho': [['GNAG0KpwKTM', 'Decoderz', 'AI Tutorial – Harris Hawks Optimization Algorithm']],
    'harmony': [['icYRI5X2M_Q', 'Gachon Geem', 'Introduction to the Harmony Search Algorithm']],
    'tlbo': [['8pfIK_xx4Dg', 'Dr. Harish Garg', 'Teaching Learning Based Optimization (TLBO)'], ['9nABMdeEJGE', 'Expertvision', 'Teaching Learning Based Optimization']]
  };
  window.MH_VIDEOS = V;
})();
