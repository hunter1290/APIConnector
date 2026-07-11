package com.joveo.apiconnector.common;

/** Produces URL-safe slugs used to build uniform endpoint paths. */
public final class SlugUtil {

    private SlugUtil() {
    }

    public static String slugify(String value) {
        if (value == null) {
            return "item";
        }
        String slug = value.toLowerCase().trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return slug.isEmpty() ? "item" : slug;
    }
}
