plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "app.marque.wear"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.marque.padel"
        minSdk = 30
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }
    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.15" }
    kotlinOptions { jvmTarget = "17" }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    testOptions { unitTests.isReturnDefaultValues = true }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.09.03"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.wear.compose:compose-material3:1.0.0-alpha24")
    implementation("androidx.wear.tiles:tiles:1.4.0")
    implementation("com.google.android.gms:play-services-wearable:18.2.0")
    implementation("androidx.health.connect:connect-client:1.1.0-alpha07")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}

// Keep the native parity fixture in sync with the canonical one generated from
// the TypeScript engine, so `./gradlew :wear:test` always validates against the
// latest golden vectors.
tasks.register<Copy>("syncGoldenVectors") {
    from("${rootDir}/../../packages/scoring-engine/fixtures/golden-vectors.json")
    into("src/test/resources")
}
tasks.named("preBuild") { dependsOn("syncGoldenVectors") }
