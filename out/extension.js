"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
// 등록된 커맨드 목록
const VALID_COMMANDS = [
    'goto',
    'char',
    'bg',
    'music',
    'stopmusic',
    'hide',
    'choice',
    'wait',
    'set',
    'if'
];
function activate(context) {
    const provider = vscode.languages.registerCompletionItemProvider('novelscript', {
        provideCompletionItems(document, position) {
            const line = document.lineAt(position).text;
            const prefix = line.slice(0, position.character);
            const match = prefix.match(/@([a-zA-Z]*)$/);
            const currentInput = match ? match[1].toLowerCase() : "";
            return VALID_COMMANDS
                .filter(cmd => cmd.startsWith(currentInput))
                .map(cmd => {
                const item = new vscode.CompletionItem("@" + cmd, vscode.CompletionItemKind.Keyword);
                item.insertText = '@' + cmd + ' ';
                item.detail = 'NovelScript Command';
                return item;
            });
        }
    }, '@', ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    context.subscriptions.push(provider);
    // ✅ 자동완성 강제 트리거 로직 추가
    vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document.languageId === 'novelscript') {
            const lastChange = e.contentChanges[0];
            if (lastChange && /^[a-zA-Z]$/.test(lastChange.text)) {
                vscode.commands.executeCommand("editor.action.triggerSuggest");
            }
        }
    });
    context.subscriptions.push(provider);
    // 문법 오류 진단기 등록
    const diagnostics = vscode.languages.createDiagnosticCollection('novelscript');
    context.subscriptions.push(diagnostics);
    vscode.workspace.onDidOpenTextDocument(checkDocument);
    vscode.workspace.onDidChangeTextDocument(e => checkDocument(e.document));
    function checkDocument(document) {
        if (document.languageId !== 'novelscript')
            return;
        const errors = [];
        for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
            const line = document.lineAt(lineNum).text;
            const match = line.match(/^@([a-zA-Z0-9_]+)/);
            if (match) {
                const cmd = match[1].toLowerCase();
                if (!VALID_COMMANDS.includes(cmd)) {
                    const range = new vscode.Range(new vscode.Position(lineNum, 0), new vscode.Position(lineNum, match[0].length));
                    errors.push(new vscode.Diagnostic(range, `Unknown command '@${cmd}'`, vscode.DiagnosticSeverity.Error));
                }
            }
        }
        diagnostics.set(document.uri, errors);
    }
}
function deactivate() { }
