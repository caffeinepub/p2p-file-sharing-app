# P2P File Sharing App

## Overview
A peer-to-peer file sharing application that enables fast, direct file transfers between devices on the same local network without using remote servers.

## Core Features

### Device Discovery
- Automatically detect and list devices running the app on the same local network
- Display device names and connection status in real-time
- Show online/offline status for discovered devices

### File Transfer
- Allow users to select single or multiple files from their device
- Initiate direct peer-to-peer transfers using WebRTC technology
- Support all common file types and formats
- Enable bidirectional transfers (send and receive)

### Transfer Management
- Display real-time progress indicators showing transfer speed and completion percentage
- Show estimated time remaining for active transfers
- Provide transfer history with completed file names and timestamps
- Allow users to cancel ongoing transfers

### User Interface
- Simple, intuitive interface for device discovery and file selection
- Clear visual indicators for transfer status (pending, active, completed, failed)
- File browser for selecting files to share
- Notification system for incoming transfer requests and completion alerts

### Security
- Secure peer-to-peer connections between devices
- User confirmation required for incoming file transfers
- Display sender device information before accepting transfers

## Technical Requirements
- WebRTC implementation for direct peer-to-peer data transfer
- Local network device discovery protocol
- File handling and transfer progress tracking
- No backend data persistence required - all operations are peer-to-peer
- Frontend-only application with no server-side file storage
