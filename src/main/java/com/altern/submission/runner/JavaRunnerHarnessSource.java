package com.altern.submission.runner;

final class JavaRunnerHarnessSource {

    private JavaRunnerHarnessSource() {
    }

    static String source() {
        return """
                import java.io.ByteArrayInputStream;
                import java.lang.reflect.InvocationTargetException;
                import java.lang.reflect.Method;
                import java.lang.reflect.Modifier;
                import java.nio.charset.StandardCharsets;

                public class RunnerHarness {

                    public static void main(String[] args) {
                        try {
                            byte[] rawInput = System.in.readAllBytes();
                            String input = new String(rawInput, StandardCharsets.UTF_8).trim();

                            Class<?> solutionClass = Class.forName("Solution");
                            Method solveMethod = findSolveMethod(solutionClass);
                            if (solveMethod != null) {
                                solveMethod.setAccessible(true);
                                Object target = Modifier.isStatic(solveMethod.getModifiers())
                                        ? null
                                        : solutionClass.getDeclaredConstructor().newInstance();
                                Object argument = adaptInput(input, solveMethod.getParameterTypes()[0]);
                                Object result = solveMethod.invoke(target, argument);
                                if (result != null) {
                                    System.out.print(String.valueOf(result));
                                }
                                return;
                            }

                            Method mainMethod = solutionClass.getMethod("main", String[].class);
                            System.setIn(new ByteArrayInputStream(rawInput));
                            mainMethod.invoke(null, (Object) new String[0]);
                        } catch (InvocationTargetException ex) {
                            Throwable cause = ex.getTargetException();
                            if (cause != null) {
                                cause.printStackTrace(System.err);
                            } else {
                                ex.printStackTrace(System.err);
                            }
                            System.exit(1);
                        } catch (Exception ex) {
                            ex.printStackTrace(System.err);
                            System.exit(1);
                        }
                    }

                    private static Method findSolveMethod(Class<?> solutionClass) {
                        Class<?>[] preferredTypes = new Class<?>[] {
                                String.class,
                                int.class,
                                Integer.class,
                                long.class,
                                Long.class
                        };

                        for (Class<?> parameterType : preferredTypes) {
                            for (Method method : solutionClass.getDeclaredMethods()) {
                                if (!method.getName().equals("solve")) {
                                    continue;
                                }
                                if (method.getParameterCount() != 1) {
                                    continue;
                                }
                                if (method.getParameterTypes()[0].equals(parameterType)) {
                                    return method;
                                }
                            }
                        }

                        return null;
                    }

                    private static Object adaptInput(String input, Class<?> parameterType) {
                        if (parameterType.equals(String.class)) {
                            return input;
                        }
                        if (parameterType.equals(int.class) || parameterType.equals(Integer.class)) {
                            return Integer.parseInt(input);
                        }
                        if (parameterType.equals(long.class) || parameterType.equals(Long.class)) {
                            return Long.parseLong(input);
                        }
                        return input;
                    }
                }
                """;
    }
}
