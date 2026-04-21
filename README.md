# Set! Now for your terminal!

A fully playable game of "Set" built with OpenTUI and Kotlin.

Contains an executable App built for Apple Silicon.

## Running the project

Install deps in the bun project:

`(cd ./SolidTUI && bun install)`

To run:

`(cd ./SolidTUI && bun run start)`


## Compiling the project natively (only tested on MacOS)

To compile a native binary of the kotlin project with graal (may require java version 21.0.10-graal installed via sdkman)

```bash
cd ./SetKotlin
./gradlew nativeCompile
```

To compile a native binary of the OpenTUI project with bun

For Apple Silicon:
```bash
cd ./SolidTUI
bun run build:bin
```

For Intel:
1. change the target in `build.ts` from `bun-darwin-arm64` to `bun-darwin-x64`
2. `cd ./SolidTUI`
3. `bun run build:bin`

### Bundling the app

`./build-app.sh`