internal import Expo
import React
import ReactAppDependencyProvider
import SwiftUI
import UIKit

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
  var nativeLifeStudioPreview = false

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    if ProcessInfo.processInfo.arguments.contains("-SPNativeLifeStudioPreview") {
      nativeLifeStudioPreview = true
      window?.rootViewController = LifeStudioHostController(rootView: LifeStudioView())
      window?.makeKeyAndVisible()
      return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  public override func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    nativeLifeStudioPreview ? .landscapeLeft : .all
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

final class LifeStudioHostController: UIHostingController<LifeStudioView> {
  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    .landscapeLeft
  }

  override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation {
    .landscapeLeft
  }

  override var prefersStatusBarHidden: Bool {
    true
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    if #available(iOS 16.0, *) {
      setNeedsUpdateOfSupportedInterfaceOrientations()
      view.window?.windowScene?.requestGeometryUpdate(
        .iOS(interfaceOrientations: .landscapeLeft)
      )
    }
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
