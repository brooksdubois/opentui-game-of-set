import solidPlugin from "./node_modules/@opentui/solid/scripts/solid-plugin";

Bun.build({
    entrypoints: ["./index.tsx"],
    minify: true,
    plugins: [solidPlugin],
    compile: {
        target: "bun-darwin-arm64",
        outfile: "./set-tui",
    },
}).then(result => {
    if (!result.success) {
        for (const log of result.logs) {
            console.error(log);
        }
        process.exit(1);
    }

    console.log("Built ./set-tui");
})

