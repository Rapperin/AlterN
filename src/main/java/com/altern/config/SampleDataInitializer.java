package com.altern.config;

import com.altern.auth.entity.UserAccount;
import com.altern.auth.entity.UserRole;
import com.altern.auth.repository.UserAccountRepository;
import com.altern.problem.entity.Difficulty;
import com.altern.problem.entity.Problem;
import com.altern.problem.entity.ProblemExampleValue;
import com.altern.problem.repository.ProblemRepository;
import com.altern.testcase.entity.TestCase;
import com.altern.testcase.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SampleDataInitializer implements CommandLineRunner {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;

    @Override
    public void run(String... args) {
        seedUsers();
        seedProblems();
    }

    private void seedUsers() {
        if (!userAccountRepository.existsByUsername("admin")) {
            saveUser("admin", "admin123", UserRole.ADMIN);
        }

        if (!userAccountRepository.existsByUsername("demo")) {
            saveUser("demo", "demo123", UserRole.USER);
        }
    }

    private void seedProblems() {
        seedMultiplesProblem();
        seedEvenFibonacciProblem();
        seedSumSquareDifferenceProblem();
        seedLargestPrimeFactorProblem();
    }

    private void seedMultiplesProblem() {
        Problem problem = findOrCreate("Multiples of 3 or 5");
        problem.setDescription("""
                Given a limit n, find the sum of all natural numbers below n that are divisible by 3 or 5.

                This is the classic warmup from Project Euler and works well as the first AlterN problem.
                """);
        problem.setDifficulty(Difficulty.EASY);
        problem.setTimeLimitMs(2000);
        problem.setConstraints("""
                1 <= n <= 1000000
                Return the sum as a single integer.
                """);
        problem.setInputFormat("A single integer n.");
        problem.setOutputFormat("Print the sum of all natural numbers below n divisible by 3 or 5.");
        problem.setHintTitle("Think in groups");
        problem.setHintContent("""
                Brute force is enough to pass, but there is a pattern:
                multiples of 3 and 5 form arithmetic progressions.
                """);
        problem.setEditorialTitle("Arithmetic progression shortcut");
        problem.setEditorialContent("""
                A brute-force loop works for the starter version, but the cleaner route is inclusion-exclusion.

                Sum the multiples of 3 below n, sum the multiples of 5 below n, then subtract the multiples of 15.
                Each partial sum is an arithmetic series:
                k + 2k + ... + mk = k * m * (m + 1) / 2

                where m = (n - 1) / k.
                """);
        problem.setTags(new ArrayList<>(List.of("math", "project-euler", "warmup")));
        problem.setExamples(new ArrayList<>(List.of(
                example("10", "23", "3, 5, 6 and 9 are below 10."),
                example("1000", "233168", "Classic Project Euler sample.")
        )));
        applyStarterCodes(problem, starterJavaLong(), starterPython(), starterCpp());
        problem = problemRepository.save(problem);

        ensureTestCases(problem, List.of(
                seedCase("10", "23", false),
                seedCase("1000", "233168", true),
                seedCase("200", "9168", true)
        ));
    }

    private void seedEvenFibonacciProblem() {
        Problem problem = findOrCreate("Even Fibonacci Sum");
        problem.setDescription("""
                Sum every even Fibonacci number that is strictly smaller than n.

                The sequence begins with 1, 2, 3, 5, 8 and so on.
                """);
        problem.setDifficulty(Difficulty.EASY);
        problem.setTimeLimitMs(2000);
        problem.setConstraints("""
                3 <= n <= 4000000
                Use 64-bit arithmetic for the result.
                """);
        problem.setInputFormat("A single integer n.");
        problem.setOutputFormat("Print the sum of all even Fibonacci terms smaller than n.");
        problem.setHintTitle("Parity repeats");
        problem.setHintContent("""
                Generate Fibonacci values in order and watch which positions are even.
                You do not need to keep the whole sequence.
                """);
        problem.setEditorialTitle("Skip odd Fibonacci values");
        problem.setEditorialContent("""
                The direct solution generates Fibonacci numbers and accumulates the even ones.

                A slightly stronger observation is that every third Fibonacci number is even, so you can step through
                the even subsequence directly instead of checking parity on every term.
                """);
        problem.setTags(new ArrayList<>(List.of("math", "fibonacci", "project-euler")));
        problem.setExamples(new ArrayList<>(List.of(
                example("100", "44", "Even terms below 100 are 2, 8 and 34."),
                example("4000000", "4613732", "Known Project Euler sample.")
        )));
        applyStarterCodes(problem, starterJavaLong(), starterPython(), starterCpp());
        problem = problemRepository.save(problem);

        ensureTestCases(problem, List.of(
                seedCase("100", "44", false),
                seedCase("4000000", "4613732", true),
                seedCase("1000", "798", true)
        ));
    }

    private void seedSumSquareDifferenceProblem() {
        Problem problem = findOrCreate("Sum Square Difference");
        problem.setDescription("""
                For the first n natural numbers, compute:
                square of the sum minus sum of the squares.
                """);
        problem.setDifficulty(Difficulty.MEDIUM);
        problem.setTimeLimitMs(2000);
        problem.setConstraints("""
                1 <= n <= 100000
                The answer may exceed 32-bit integer range.
                """);
        problem.setInputFormat("A single integer n.");
        problem.setOutputFormat("Print the difference between (1 + ... + n)^2 and (1^2 + ... + n^2).");
        problem.setHintTitle("Try small n by hand");
        problem.setHintContent("""
                Expand the first few cases and look for a formula instead of iterating to n every time.
                """);
        problem.setEditorialTitle("Use closed-form formulas");
        problem.setEditorialContent("""
                This problem is mostly about recognizing two classic formulas:

                1 + 2 + ... + n = n(n + 1) / 2
                1^2 + 2^2 + ... + n^2 = n(n + 1)(2n + 1) / 6

                Compute both with 64-bit arithmetic, square the first sum, then subtract the second.
                """);
        problem.setTags(new ArrayList<>(List.of("math", "formula", "project-euler")));
        problem.setExamples(new ArrayList<>(List.of(
                example("10", "2640", "Standard sample for the problem."),
                example("100", "25164150", "Reference value for n = 100.")
        )));
        applyStarterCodes(problem, starterJavaLong(), starterPython(), starterCpp());
        problem = problemRepository.save(problem);

        ensureTestCases(problem, List.of(
                seedCase("10", "2640", false),
                seedCase("100", "25164150", true),
                seedCase("20", "41230", true)
        ));
    }

    private void seedLargestPrimeFactorProblem() {
        Problem problem = findOrCreate("Largest Prime Factor");
        problem.setDescription("""
                Given a positive integer n, find its largest prime factor.

                This one starts simple but needs careful handling for larger inputs.
                """);
        problem.setDifficulty(Difficulty.MEDIUM);
        problem.setTimeLimitMs(2500);
        problem.setConstraints("""
                2 <= n <= 600851475143
                Use 64-bit arithmetic.
                """);
        problem.setInputFormat("A single integer n.");
        problem.setOutputFormat("Print the largest prime factor of n.");
        problem.setHintTitle("Factor while shrinking n");
        problem.setHintContent("""
                When you divide out a factor completely, the remaining n gets much smaller.
                That makes the search space collapse quickly.
                """);
        problem.setEditorialTitle("Divide out small factors as you go");
        problem.setEditorialContent("""
                Repeatedly divide n by the current factor while it is divisible.

                Once factor * factor exceeds the remaining n, any leftover value larger than 1 is itself prime and is
                the largest prime factor. This keeps the loop compact and avoids storing every factor.
                """);
        problem.setTags(new ArrayList<>(List.of("number-theory", "primes", "project-euler")));
        problem.setExamples(new ArrayList<>(List.of(
                example("13195", "29", "Prime factors are 5, 7, 13 and 29."),
                example("600851475143", "6857", "The canonical Project Euler sample.")
        )));
        applyStarterCodes(problem, starterJavaLong(), starterPython(), starterCpp());
        problem = problemRepository.save(problem);

        ensureTestCases(problem, List.of(
                seedCase("13195", "29", false),
                seedCase("600851475143", "6857", true),
                seedCase("29", "29", true)
        ));
    }

    private void saveTestCase(Problem problem, String input, String expectedOutput, boolean hidden) {
        TestCase testCase = new TestCase();
        testCase.setProblem(problem);
        testCase.setInput(input);
        testCase.setExpectedOutput(expectedOutput);
        testCase.setHidden(hidden);
        testCaseRepository.save(testCase);
    }

    private void ensureTestCases(Problem problem, List<SeedTestCase> testCases) {
        if (problem.getId() != null && testCaseRepository.countByProblem_Id(problem.getId()) > 0) {
            return;
        }

        for (SeedTestCase testCase : testCases) {
            saveTestCase(problem, testCase.input(), testCase.expectedOutput(), testCase.hidden());
        }
    }

    private Problem findOrCreate(String title) {
        return problemRepository.findByTitleIgnoreCase(title).orElseGet(() -> {
            Problem problem = new Problem();
            problem.setTitle(title);
            return problem;
        });
    }

    private void applyStarterCodes(Problem problem, String javaStarter, String pythonStarter, String cppStarter) {
        problem.setStarterCodeJava(javaStarter);
        problem.setStarterCodePython(pythonStarter);
        problem.setStarterCodeCpp(cppStarter);
    }

    private ProblemExampleValue example(String input, String output, String explanation) {
        ProblemExampleValue example = new ProblemExampleValue();
        example.setInput(input);
        example.setOutput(output);
        example.setExplanation(explanation);
        return example;
    }

    private SeedTestCase seedCase(String input, String expectedOutput, boolean hidden) {
        return new SeedTestCase(input, expectedOutput, hidden);
    }

    private String starterJavaLong() {
        return """
                public class Solution {
                    public static long solve(long n) {
                        return 0L;
                    }
                }
                """;
    }

    private String starterPython() {
        return """
                n = int(input().strip())

                result = 0

                print(result)
                """;
    }

    private String starterCpp() {
        return """
                #include <iostream>
                using namespace std;

                int main() {
                    long long n;
                    cin >> n;

                    long long result = 0;
                    cout << result;
                    return 0;
                }
                """;
    }

    private void saveUser(String username, String rawPassword, UserRole role) {
        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        userAccountRepository.save(user);
    }

    private record SeedTestCase(String input, String expectedOutput, boolean hidden) {
    }
}
