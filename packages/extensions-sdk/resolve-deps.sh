#!/bin/bash
# Script to resolve workspace and catalog references for publishing

# Create a backup of the original package.json
cp package.json package.json.bak

# Use pnpm to resolve workspace and catalog references
pnpm pack --pack-destination /tmp/

# If pack succeeded, extract the resolved package.json
if [ $? -eq 0 ]; then
    # Find the created tarball
    TARBALL=$(ls -t /tmp/@zjpiazza-directus-extensions-sdk-*.tgz | head -n1)
    if [ -f "$TARBALL" ]; then
        # Extract package.json from tarball to see resolved dependencies
        tar -xzf "$TARBALL" -C /tmp/ package/package.json
        echo "Resolved package.json:"
        cat /tmp/package/package.json
        rm -f "$TARBALL"
        rm -rf /tmp/package
    fi
else
    echo "Pack failed"
fi

# Restore the original package.json
mv package.json.bak package.json
