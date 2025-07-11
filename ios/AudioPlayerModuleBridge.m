#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AudioPlayerModule, RCTEventEmitter)

RCT_EXTERN_METHOD(loadTrack:(NSDictionary *)trackData)

RCT_EXTERN_METHOD(play:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(pause:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(seek:(double)position
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setVolume:(double)volume
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCurrentPosition:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getDuration:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
