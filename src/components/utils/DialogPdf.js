import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import ShareIcon from '@mui/icons-material/Share';

// Helper to convert PDF document to Blob and share
const sharePdf = async (document, fileName = 'report.pdf') => {
  try {
    const blob = await pdf(document).toBlob();
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'application/pdf' })] })) {
      const file = new File([blob], fileName, { type: 'application/pdf' });
      await navigator.share({
        files: [file],
        title: fileName,
        text: 'PDF Report',
      });
    } else {
      // Fallback: download the file if Web Share API is not supported
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
   // alert('ناتوانرێت فایلەکە هاوبەش بکرێت.');
  }
};

const DialogPdf = ({
  open,
  onClose,
  document,
  fileName = 'expenses.pdf',
  width = '100%',
  height = 750,
  downloadLabel = 'داگرتن',
  closeLabel = 'داخستن',
  shareLabel = 'هاوبەشکردن',
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
    <PDFViewer width={width} height={height}>
      {document}
    </PDFViewer>
    <DialogActions>

      <PDFDownloadLink document={document} fileName={fileName}>
        {({ loading }) =>
          loading ? (
            <Button variant="contained" disabled>
              چاوەڕوانبە...
            </Button>
          ) : (
            <Button variant="contained" color="primary">
              {downloadLabel}
            </Button>
          )
        }
      </PDFDownloadLink>
      <Button
        variant="contained"
        color="info"
        startIcon={<ShareIcon />}
        onClick={() => sharePdf(document, fileName)}
      >
        {shareLabel}
      </Button>
     

      <Button variant="outlined" color="secondary" onClick={onClose}>
        {closeLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default DialogPdf;