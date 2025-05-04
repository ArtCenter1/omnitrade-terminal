/**
 * Plugin Manifest Validator
 * 
 * Validates plugin manifests against the schema.
 */

import { PluginManifest } from './types';
import semver from 'semver';

/**
 * Validation error
 */
export class ManifestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManifestValidationError';
  }
}

/**
 * Validates a plugin manifest
 * 
 * @param manifest The manifest to validate
 * @throws ManifestValidationError if the manifest is invalid
 */
export function validateManifest(manifest: any): PluginManifest {
  // Check required fields
  const requiredFields = ['id', 'name', 'version', 'description', 'author', 'main', 'extensionPoints'];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      throw new ManifestValidationError(`Missing required field: ${field}`);
    }
  }
  
  // Validate ID format (alphanumeric, dashes, no spaces)
  if (!/^[a-z0-9-]+$/.test(manifest.id)) {
    throw new ManifestValidationError(
      `Invalid plugin ID: ${manifest.id}. IDs must contain only lowercase letters, numbers, and dashes.`
    );
  }
  
  // Validate version format (semver)
  if (!semver.valid(manifest.version)) {
    throw new ManifestValidationError(
      `Invalid version format: ${manifest.version}. Must be a valid semver version.`
    );
  }
  
  // Validate extension points
  if (!Array.isArray(manifest.extensionPoints)) {
    throw new ManifestValidationError('extensionPoints must be an array');
  }
  
  // Validate permissions
  if (manifest.permissions && !Array.isArray(manifest.permissions)) {
    throw new ManifestValidationError('permissions must be an array');
  }
  
  // Validate dependencies
  if (manifest.dependencies) {
    if (typeof manifest.dependencies !== 'object' || Array.isArray(manifest.dependencies)) {
      throw new ManifestValidationError('dependencies must be an object');
    }
    
    // Validate dependency version requirements
    for (const [depId, versionReq] of Object.entries(manifest.dependencies)) {
      if (typeof versionReq !== 'string') {
        throw new ManifestValidationError(
          `Invalid version requirement for dependency ${depId}: ${versionReq}`
        );
      }
      
      try {
        // This will throw if the version requirement is invalid
        new semver.Range(versionReq as string);
      } catch (error) {
        throw new ManifestValidationError(
          `Invalid version requirement for dependency ${depId}: ${versionReq}. Must be a valid semver range.`
        );
      }
    }
  }
  
  // Validate compatibility
  if (manifest.compatibility) {
    if (typeof manifest.compatibility !== 'object' || Array.isArray(manifest.compatibility)) {
      throw new ManifestValidationError('compatibility must be an object');
    }
    
    if (manifest.compatibility.terminal) {
      try {
        // This will throw if the version requirement is invalid
        new semver.Range(manifest.compatibility.terminal);
      } catch (error) {
        throw new ManifestValidationError(
          `Invalid terminal version requirement: ${manifest.compatibility.terminal}. Must be a valid semver range.`
        );
      }
    }
  }
  
  // Return the validated manifest
  return manifest as PluginManifest;
}
