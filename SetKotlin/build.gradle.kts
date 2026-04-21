plugins {
    kotlin("jvm") version "2.3.10"
    kotlin("plugin.serialization") version "2.3.10"
    application
    id("org.graalvm.buildtools.native") version "1.0.0"
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    testImplementation(kotlin("test"))
}

kotlin {
    jvmToolchain(21)
}

val engineMainClass = "org.brooks.MainKt"

application {
    mainClass.set(engineMainClass)
}

graalvmNative {
    binaries {
        named("main") {
            imageName.set("set-engine")
            mainClass.set(engineMainClass)
            buildArgs.add("--initialize-at-build-time=kotlin.DeprecationLevel")
        }
    }
}

tasks.named<JavaExec>("run") {
    standardInput = System.`in`
    outputs.upToDateWhen { false }
}

tasks.test {
    useJUnitPlatform()
}
