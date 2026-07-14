package com.joveo.apiconnector.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

/** Pure unit tests for {@link SlugUtil} — no Spring context, no database. */
class SlugUtilTest {

    @ParameterizedTest
    @CsvSource({
            "Hello World, hello-world",
            "  Trim Me  , trim-me",
            "Weather API v2, weather-api-v2",
            "UPPER case, upper-case",
            "multiple   spaces, multiple-spaces",
            "special!!!chars@@@here, special-chars-here",
            "already-a-slug, already-a-slug",
    })
    @DisplayName("slugify normalizes to lowercase, hyphen-separated tokens")
    void slugifyNormalizesInput(String input, String expected) {
        assertThat(SlugUtil.slugify(input)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   ", "!!!", "---", "@#$%"})
    @DisplayName("slugify falls back to \"item\" for null/blank/symbol-only input")
    void slugifyFallsBackToItem(String input) {
        assertThat(SlugUtil.slugify(input)).isEqualTo("item");
    }

    @Test
    @DisplayName("slugify strips leading and trailing hyphens")
    void slugifyStripsEdgeHyphens() {
        assertThat(SlugUtil.slugify("---edge---")).isEqualTo("edge");
        assertThat(SlugUtil.slugify(".leading and trailing.")).isEqualTo("leading-and-trailing");
    }
}
