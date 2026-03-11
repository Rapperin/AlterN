package com.altern.submission.runner;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Comparator;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

final class ProcessExecutionSupport {

    private ProcessExecutionSupport() {
    }

    static ProcessOutcome execute(Path workingDirectory, Duration timeout, String stdin, String... command)
            throws IOException, InterruptedException {
        Process process = new ProcessBuilder(command)
                .directory(workingDirectory.toFile())
                .start();

        CompletableFuture<String> stdout = readAsync(process.getInputStream());
        CompletableFuture<String> stderr = readAsync(process.getErrorStream());

        try (OutputStream outputStream = process.getOutputStream()) {
            if (stdin != null) {
                outputStream.write(stdin.getBytes(StandardCharsets.UTF_8));
            }
        }

        boolean finished = process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS);
        if (!finished) {
            process.destroyForcibly();
            return new ProcessOutcome(-1, stdout.join(), stderr.join(), true);
        }

        return new ProcessOutcome(process.exitValue(), stdout.join(), stderr.join(), false);
    }

    static int elapsedMillis(long startedAtNanos) {
        return Math.max(1, (int) Duration.ofNanos(System.nanoTime() - startedAtNanos).toMillis());
    }

    static String cleanMessage(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Unknown runner error.";
        }

        String trimmed = raw.trim();
        if (trimmed.length() <= 1200) {
            return trimmed;
        }

        return trimmed.substring(0, 1200) + "...";
    }

    static void deleteDirectoryQuietly(Path directory) {
        if (directory == null || !Files.exists(directory)) {
            return;
        }

        try (var stream = Files.walk(directory)) {
            stream.sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException ignored) {
                        }
                    });
        } catch (IOException ignored) {
        }
    }

    private static CompletableFuture<String> readAsync(InputStream inputStream) {
        return CompletableFuture.supplyAsync(() -> {
            try (InputStream stream = inputStream) {
                return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                return "";
            }
        });
    }

    record ProcessOutcome(int exitCode, String stdout, String stderr, boolean timedOut) {
    }
}
