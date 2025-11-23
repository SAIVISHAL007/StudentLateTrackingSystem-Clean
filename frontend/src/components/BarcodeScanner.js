import React, { useState, useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';
import { useToast } from './ToastProvider';

const BarcodeScanner = ({ onDetected, onClose, isActive }) => {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const videoRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (!isActive) return;

    const config = {
      inputStream: {
        type: 'LiveStream',
        target: videoRef.current,
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: 'environment',
          aspectRatio: { min: 1, max: 2 }
        }
      },
      locator: {
        patchSize: 'medium',
        halfSample: true
      },
      numOfWorkers: navigator.hardwareConcurrency || 4,
      frequency: 10,
      decoder: {
        readers: [
          'code_128_reader',
          'code_39_reader',
          'code_39_vin_reader',
          'ean_reader',
          'ean_8_reader',
          'upc_reader',
          'upc_e_reader',
          'i2of5_reader'
        ],
        multiple: false
      },
      locate: true
    };

    Quagga.init(config, (err) => {
      if (err) {
        console.error('Barcode scanner initialization error:', err);
        toast.error('Camera access denied or unavailable');
        return;
      }
      setScanning(true);
      Quagga.start();
    });

    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      
      // Debounce - prevent duplicate scans
      if (code === lastScanned) return;
      
      setLastScanned(code);
      onDetected(code);
      
      // Visual feedback
      if (videoRef.current) {
        videoRef.current.style.border = '4px solid #10b981';
        setTimeout(() => {
          if (videoRef.current) videoRef.current.style.border = '2px solid #667eea';
        }, 500);
      }
      
      toast.success(`Scanned: ${code}`);
    });

    return () => {
      Quagga.stop();
      setScanning(false);
    };
  }, [isActive, onDetected, lastScanned, toast]);

  if (!isActive) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📷 Scan Student ID Barcode
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            ✕ Close
          </button>
        </div>

        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid #667eea'
        }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {/* Scan overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '60%',
            border: '3px solid #10b981',
            borderRadius: '12px',
            boxShadow: 'inset 0 0 0 2000px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
              animation: 'scan 2s linear infinite'
            }} />
          </div>
          
          {scanning && (
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(16, 185, 129, 0.9)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              🔍 Scanning...
            </div>
          )}
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#f3f4f6',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          💡 <strong>Tip:</strong> Position the barcode within the green frame. Supported formats: Code128, Code39, EAN, UPC.
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
