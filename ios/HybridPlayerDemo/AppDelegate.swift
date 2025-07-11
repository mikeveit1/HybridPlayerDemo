import UIKit
import React

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    
    let jsCodeLocation: URL
    
    #if DEBUG
    guard let debugURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index") else {
      fatalError("Could not load JavaScript bundle from Metro server")
    }
    jsCodeLocation = debugURL
    #else
    guard let bundleURL = Bundle.main.url(forResource: "main", withExtension: "jsbundle") else {
      fatalError("Could not find JavaScript bundle in app bundle")
    }
    jsCodeLocation = bundleURL
    #endif

    let rootView = RCTRootView(
      bundleURL: jsCodeLocation,
      moduleName: "HybridPlayerDemo",
      initialProperties: nil,
      launchOptions: launchOptions
    )

    let rootViewController = UIViewController()
    rootViewController.view = rootView

    window = UIWindow(frame: UIScreen.main.bounds)
    window?.rootViewController = rootViewController
    window?.makeKeyAndVisible()

    return true
  }
}
