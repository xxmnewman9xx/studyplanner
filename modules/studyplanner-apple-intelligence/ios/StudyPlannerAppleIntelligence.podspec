require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'StudyPlannerAppleIntelligence'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = 'StudyPlanner'
  s.homepage       = 'https://example.invalid/studyplanner'
  # The app target stays at iOS 16.4. Every Foundation Models / iOS 26 Vision
  # symbol is behind `@available(iOS 26.0, *)` and `#available` checks.
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://example.invalid/studyplanner.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision', 'UIKit', 'ImageIO', 'PDFKit', 'CoreSpotlight', 'UniformTypeIdentifiers'
  # FoundationModels only exists on iOS 26+. It MUST be weak-linked so the app
  # still launches on iOS 16.4-25 (verify with `otool -l` => LC_LOAD_WEAK_DYLIB).
  s.weak_frameworks = ['FoundationModels']
  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
