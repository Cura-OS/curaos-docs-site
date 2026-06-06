# NGINX static host for the CuraOS external docs site.
#
# The image bundles the pre-built MkDocs Material static output (site/) and
# serves it with zero external egress — suitable for on-prem, hybrid, and
# air-gap (Zarf) profiles. The base image is digest-pinned per the version-
# pinning policy; Renovate keeps the digest fresh.
#
# Build context expects a built `site/` dir at the repo root:
#   scripts/build-external.sh --content-dir <mirror/docs-content>
#   docker buildx build -f hosting/nginx/Dockerfile -t curaos-docs:local .
FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10

# Self-contained static site (no upstream proxy, no remote assets).
COPY site/ /usr/share/nginx/html/
COPY hosting/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
# Run as the unprivileged nginx user (read-only static content).
USER nginx
