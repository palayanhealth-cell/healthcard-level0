import { useEffect, useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/react';
import { QRCodeSVG } from 'qrcode.react';
import { supabaseHealthCardService } from '../services/supabaseHealthCardService';
import { useAuth } from '../hooks/useAuth';
import type { HealthCardRecord } from '../types/domain';
import './Portal.css';

const ClientCardPage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [record, setRecord] = useState<HealthCardRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCard = async () => {
      if (!profile) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const nextRecord = await supabaseHealthCardService.getClientCard(profile.id);
        setRecord(nextRecord);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Failed to load health card.');
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [profile]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Client e-Health Card</IonTitle>
          <IonButton slot="end" fill="clear" onClick={() => signOut()}>
            Sign Out
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="portal-content">
          {loading && <IonSpinner name="crescent" />}
          {error && <p className="error-text">{error}</p>}
          {!loading && !error && record && (
            <IonCard className="id-card">
              <IonCardContent>
                <div className="id-header">
                  <div>
                    <p className="small">Palayan City Hospital</p>
                    <h2>Health Identity Card</h2>
                    <p className="small">Card Number: {record.card_number}</p>
                  </div>
                </div>
                <div className="id-body">
                  <div>
                    <p className="label">Name</p>
                    <p className="value">{record.full_name}</p>
                    <p className="label">Address</p>
                    <p className="value">{record.complete_address}</p>
                    <p className="label">Birth Date</p>
                    <p className="value">{record.date_of_birth}</p>
                    <p className="label">Blood Type</p>
                    <p className="value">{record.blood_type ?? 'N/A'}</p>
                  </div>
                  <div className="qr-wrap">
                    <QRCodeSVG value={record.card_qr_value} size={180} />
                    <p className="small">Use this QR for hospital transactions.</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}
          {!loading && !record && !error && <p>No health card found yet. Please contact hospital encoder.</p>}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ClientCardPage;
