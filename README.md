Install deps in the bun project:

`(cd ./SolidTUI && bun install)`

To run:

`(cd ./SetKotlin && ./gradlew -q runJsonAdapter >/dev/null 2>&1) & (cd ./SolidTUI && bun run start)`
