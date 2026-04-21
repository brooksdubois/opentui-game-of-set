plugins {
    kotlin("jvm") version "2.3.10"
    kotlin("plugin.serialization") version "2.3.10"
    application
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

application {
    mainClass.set("org.brooks.MainWithPickingKt")
}

tasks.register<JavaExec>("runJsonAdapter") {
    group = "application"
    description = "Runs the JSON-lines Set engine adapter."
    mainClass.set("org.brooks.MainJsonAdapterKt")
    classpath = sourceSets.main.get().runtimeClasspath
    standardInput = System.`in`
}

tasks.test {
    useJUnitPlatform()
}
