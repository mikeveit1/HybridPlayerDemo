import Foundation
import AVFoundation
import React

@objc(AudioPlayerModule)
class AudioPlayerModule: RCTEventEmitter {
    
    private var audioPlayer: AVAudioPlayer?
    private var progressTimer: Timer?
    private var currentTrackData: [String: Any]?
    
    override init() {
        super.init()
        setupAudioSession()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func supportedEvents() -> [String]! {
        return [
            "onPlaybackStateChanged",
            "onProgressUpdate", 
            "onTrackLoaded",
            "onError"
        ]
    }
    
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            sendEvent(withName: "onError", body: [
                "message": "Failed to setup audio session: \(error.localizedDescription)"
            ])
        }
    }
    
    @objc
    func loadTrack(_ trackData: [String: Any]) {
        currentTrackData = trackData
        
        guard let urlString = trackData["url"] as? String,
              let url = URL(string: urlString) else {
            sendEvent(withName: "onError", body: [
                "message": "Invalid audio URL"
            ])
            return
        }
        
        loadAudioFromURL(url)
    }
    
    @objc
    func play(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let player = audioPlayer else {
            reject("NO_PLAYER", "No audio player available", nil)
            return
        }
        
        if player.play() {
            startProgressTimer()
            sendEvent(withName: "onPlaybackStateChanged", body: ["state": "playing"])
            resolve(nil)
        } else {
            reject("PLAY_FAILED", "Failed to start playback", nil)
        }
    }
    
    @objc
    func pause(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let player = audioPlayer else {
            reject("NO_PLAYER", "No audio player available", nil)
            return
        }
        
        player.pause()
        stopProgressTimer()
        sendEvent(withName: "onPlaybackStateChanged", body: ["state": "paused"])
        resolve(nil)
    }
    
    @objc
    func seek(_ position: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let player = audioPlayer else {
            reject("NO_PLAYER", "No audio player available", nil)
            return
        }
        
        player.currentTime = position
        
        sendEvent(withName: "onProgressUpdate", body: [
            "position": player.currentTime,
            "duration": player.duration
        ])
        
        resolve(nil)
    }
    
    @objc
    func setVolume(_ volume: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let player = audioPlayer else {
            reject("NO_PLAYER", "No audio player available", nil)
            return
        }
        
        player.volume = Float(volume)
        resolve(nil)
    }
    
    @objc
    func getCurrentPosition(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let player = audioPlayer else {
            resolve(0)
            return
        }
        
        resolve(player.currentTime)
    }
    
    @objc
    func getDuration(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let player = audioPlayer else {
            resolve(0)
            return
        }
        
        resolve(player.duration)
    }
    
    private func loadAudioFromURL(_ url: URL) {
        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                
                if let error = error {
                    self.sendEvent(withName: "onError", body: [
                        "message": "Failed to load audio: \(error.localizedDescription)"
                    ])
                    return
                }
                
                guard let data = data else {
                    self.sendEvent(withName: "onError", body: [
                        "message": "No audio data received"
                    ])
                    return
                }
                
                do {
                    self.audioPlayer = try AVAudioPlayer(data: data)
                    self.audioPlayer?.delegate = self
                    self.audioPlayer?.prepareToPlay()
                    
                    self.sendEvent(withName: "onTrackLoaded", body: [
                        "duration": self.audioPlayer?.duration ?? 0
                    ])
                    
                    self.sendEvent(withName: "onPlaybackStateChanged", body: ["state": "idle"])
                    
                } catch {
                    self.sendEvent(withName: "onError", body: [
                        "message": "Failed to create audio player: \(error.localizedDescription)"
                    ])
                }
            }
        }.resume()
    }
    
    private func startProgressTimer() {
        stopProgressTimer()
        progressTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.updateProgress()
        }
    }
    
    private func stopProgressTimer() {
        progressTimer?.invalidate()
        progressTimer = nil
    }
    
    private func updateProgress() {
        guard let player = audioPlayer else { return }
        
        sendEvent(withName: "onProgressUpdate", body: [
            "position": player.currentTime,
            "duration": player.duration
        ])
    }
    
    deinit {
        stopProgressTimer()
        audioPlayer = nil
    }
}

extension AudioPlayerModule: AVAudioPlayerDelegate {
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        stopProgressTimer()
        sendEvent(withName: "onPlaybackStateChanged", body: ["state": "idle"])
    }
    
    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        stopProgressTimer()
        sendEvent(withName: "onError", body: [
            "message": error?.localizedDescription ?? "Audio decode error"
        ])
    }
}
