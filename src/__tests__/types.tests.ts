import * as ts from "typescript";

interface CompilationResult {
    dtsOutput: string;
    jsOutput: string;
    errors: string[];
}

function compileModule(sourceCode: string): CompilationResult {
    const baseName = "imaginarySourceFile";
    const inputFileName = baseName + ".ts";
    const outputDtsFileName = baseName + ".d.ts";
    const outputJsFileName = baseName + ".js";

    const options: ts.CompilerOptions = {
        declaration: true,
        strict: true,
        baseUrl: "..",
        emitDeclarationOnly: true
    };
    const host = ts.createCompilerHost(options);

    const result: CompilationResult = { dtsOutput: "", jsOutput: "", errors: [] };

    const superGetSourceFile = host.getSourceFile;
    host.getSourceFile = (
        fileName: string,
        languageVersion: ts.ScriptTarget,
        onError?: ((message: string) => void) | undefined,
        shouldCreateNewSourceFile?: boolean | undefined
    ) => {
        if (fileName === inputFileName) {
            return ts.createSourceFile(fileName, sourceCode, languageVersion);
        } else {
            return superGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
        }
    };

    const writeFile: ts.WriteFileCallback = (
        fileName: string,
        data: string,
        writeByteOrderMark: boolean,
        onError: ((message: string) => void) | undefined,
        sourceFiles: ReadonlyArray<ts.SourceFile>
    ) => {
        if (fileName === outputDtsFileName) {
            result.dtsOutput = data;
        } else if (fileName === outputJsFileName) {
            result.jsOutput = data;
        }
    };

    const program = ts.createProgram([inputFileName], options, host);
    const emitResult = program.emit(undefined, writeFile);

    const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            result.errors.push(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
            result.errors.push(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
        }
    });

    return result;
}

describe("type inference", () => {
    const commonSourceCode = [
        `import { InferType, Validated, Validator } from ".";`,
        `export { Validated, Validator };`
    ];

    it("works correctly for basic types", () => {
        const sourceCode = [
            ...commonSourceCode,
            `import { aString } from ".";
             export const t1 = aString;
             export type T1 = InferType<typeof t1>;`
        ].join("\n");
        expect(compileModule(sourceCode)).toMatchSnapshot();
    });

    it("works correctly for shallow object types", () => {
        const sourceCode = [
            ...commonSourceCode,
            `import { anObject, aString, aNumber, aBoolean } from ".";
             export const t1 = anObject({
                 foo: aString,
                 bar: aNumber,
                 baz: aBoolean
             });
             export type T1 = InferType<typeof t1>;`
        ].join("\n");
        expect(compileModule(sourceCode)).toMatchSnapshot();
    });

    it("works correctly for shallow object types with arrays and optionals", () => {
        const sourceCode = [
            ...commonSourceCode,
            `import { anObject, aString, aNumber, aBoolean } from ".";
             export const t1 = anObject({
                 foo: aString.orNull.array.orNull.orUndefined,
                 bar: aNumber.orNull,
                 baz: aBoolean.orUndefined
             });
             export type T1 = InferType<typeof t1>;`
        ].join("\n");
        expect(compileModule(sourceCode)).toMatchSnapshot();
    });
});
