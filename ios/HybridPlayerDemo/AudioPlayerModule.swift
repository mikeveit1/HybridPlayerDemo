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
    
    private func cleanupCurrentPlayer() {
        stopProgressTimer()
        
        if let player = audioPlayer {
            if player.isPlaying {
                player.stop()
            }
            audioPlayer?.delegate = nil
            audioPlayer = nil
        }
    }
    
    @objc
    func loadTrack(_ trackData: [String: Any]) {
        cleanupCurrentPlayer()
        
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
        if url.scheme == "file" || url.isFileURL {
            loadLocalAudio(url)
        } else {
            URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    
                    if let error = error {
                        self.sendEvent(withName: "onError", body: [
                            "message": "Failed to load audio: \(error.localizedDescription)"
                        ])
                        return
                    }
                    
                    if let httpResponse = response as? HTTPURLResponse {
                        if httpResponse.statusCode != 200 {
                            self.sendEvent(withName: "onError", body: [
                                "message": "HTTP error \(httpResponse.statusCode)"
                            ])
                            return
                        }
                    }
                    
                    guard let data = data else {
                        self.sendEvent(withName: "onError", body: [
                            "message": "No audio data received"
                        ])
                        return
                    }
                    
                    if data.count < 100 {
                        self.sendEvent(withName: "onError", body: [
                            "message": "Invalid audio data - file too small"
                        ])
                        return
                    }
                    
                    do {
                        self.cleanupCurrentPlayer()
                        
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
    }

    private func loadLocalAudio(_ url: URL) {
        do {
            cleanupCurrentPlayer()
            
            let data = try Data(contentsOf: url)
            self.audioPlayer = try AVAudioPlayer(data: data)
            self.audioPlayer?.delegate = self
            self.audioPlayer?.prepareToPlay()
            
            self.sendEvent(withName: "onTrackLoaded", body: [
                "duration": self.audioPlayer?.duration ?? 0
            ])
            
            self.sendEvent(withName: "onPlaybackStateChanged", body: ["state": "idle"])
            
        } catch {
            self.sendEvent(withName: "onError", body: [
                "message": "Failed to load local audio: \(error.localizedDescription)"
            ])
        }
    }
    
    private func startProgressTimer() {
        stopProgressTimer()
        
        DispatchQueue.main.async { [weak self] in
            self?.progressTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
                self?.updateProgress()
            }
            
            if let timer = self?.progressTimer {
                RunLoop.main.add(timer, forMode: .common)
            }
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
        cleanupCurrentPlayer()
    }
}

extension AudioPlayerModule: AVAudioPlayerDelegate {
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        stopProgressTimer()
        
        sendEvent(withName: "onProgressUpdate", body: [
            "position": player.duration,
            "duration": player.duration
        ])
        
        sendEvent(withName: "onPlaybackStateChanged", body: ["state": "idle"])
    }
    
    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        stopProgressTimer()
        sendEvent(withName: "onError", body: [
            "message": error?.localizedDescription ?? "Audio decode error"
        ])
    }
}
