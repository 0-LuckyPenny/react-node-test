import { Box, Button, Flex, Grid, GridItem, Heading, Text } from "@chakra-ui/react";
import { IoIosArrowBack } from "react-icons/io";
import { FaFilePdf } from "react-icons/fa";
import { DeleteIcon } from "@chakra-ui/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import moment from "moment";
import { HasAccess } from "../../../redux/accessUtils";
import { getApi, deleteApi } from "services/api";
import Spinner from "components/spinner/Spinner";
import Card from "components/card/Card";
import CommonDeleteModel from "components/commonDeleteModel";
import html2pdf from "html2pdf.js";
import { HSeparator } from "components/separator/Separator";

const View = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [permission, contactAccess, leadAccess] = HasAccess(['Meetings', 'Contacts', 'Leads']);
  const [loadingPDF, setLoadingPDF] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await getApi('api/meeting/view/', id);
        setData(response?.data);
      } catch (error) {
        console.error("Error fetching meeting data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const generatePDF = () => {
    setLoadingPDF(true);
    const element = document.getElementById("reports");
    const hideBtn = document.getElementById("hide-btn");

    if (element) {
      hideBtn.style.display = 'none';
      html2pdf()
        .from(element)
        .set({
          margin: [0, 0, 0, 0],
          filename: `Meeting_Details_${moment().format("DD-MM-YYYY")}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: true },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .save()
        .then(() => {
          setLoadingPDF(false);
          hideBtn.style.display = '';
        });
    } else {
      console.error("Element with ID 'reports' not found.");
      setLoadingPDF(false);
    }
  };

  const handleDeleteMeeting = async () => {
    setIsLoading(true);
    try {
      const response = await deleteApi('api/meeting/delete/', id);
      if (response.status === 200) {
        setDeleteModalOpen(false);
        navigate(-1);
      }
    } catch (error) {
      console.error("Error deleting meeting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAttendees = () => {
    if (data?.related === 'Contact' && contactAccess?.view) {
      return data.attendes?.map((item) => (
        <Link to={`/contactView/${item._id}`} key={item._id}>
          <Text color='brand.600' _hover={{ color: 'blue.500', textDecoration: 'underline' }}>
            {item.firstName} {item.lastName}
          </Text>
        </Link>
      ));
    }

    if (data?.related === 'Lead' && leadAccess?.view) {
      return data.attendesLead?.map((item) => (
        <Link to={`/leadView/${item._id}`} key={item._id}>
          <Text color='brand.600' _hover={{ color: 'blue.500', textDecoration: 'underline' }}>
            {item.leadName}
          </Text>
        </Link>
      ));
    }

    return data?.attendes?.map((item, index) => (
      <Text key={index} color='blackAlpha.900'>
        {item.firstName} {item.lastName}
      </Text>
    )) || '-';
  };

  if (isLoading) {
    return (
      <Flex justifyContent={'center'} alignItems={'center'} width="100%">
        <Spinner />
      </Flex>
    );
  }

  return (
    <>
      <Grid templateColumns="repeat(4, 1fr)" gap={3} id="reports">
        <GridItem colSpan={4}>
          <Heading size="lg" m={3}>
            {data?.agenda || ""}
          </Heading>
        </GridItem>

        <GridItem colSpan={4}>
          <Card>
            <Grid gap={4}>
              <GridItem colSpan={2}>
                <Flex justifyContent={"space-between"}>
                  <Heading size="md" mb={3}>Meeting Details</Heading>
                  <Box id="hide-btn">
                    <Button
                      leftIcon={<FaFilePdf />}
                      size='sm'
                      variant="brand"
                      onClick={generatePDF}
                      disabled={loadingPDF}
                    >
                      {loadingPDF ? "Please Wait..." : "Print as PDF"}
                    </Button>
                    <Button
                      leftIcon={<IoIosArrowBack />}
                      size='sm'
                      variant="brand"
                      onClick={() => navigate(-1)}
                      ml={2}
                    >
                      Back
                    </Button>
                  </Box>
                </Flex>
                <HSeparator />
              </GridItem>

              {[
                { label: 'Agenda', value: data?.agenda },
                { label: 'Created By', value: data?.createdByName },
                { label: 'DateTime', value: moment(data?.dateTime).format('DD-MM-YYYY  h:mma ') },
                { label: 'Timestamp', value: moment(data?.timestamp).format('DD-MM-YYYY  h:mma ') },
                { label: 'Location', value: data?.location },
                { label: 'Notes', value: data?.notes },
              ].map((item, idx) => (
                <GridItem key={idx} colSpan={{ base: 2, md: 1 }}>
                  <Text fontSize="sm" fontWeight="bold" color={'blackAlpha.900'}>{item.label}</Text>
                  <Text>{item.value || ' - '}</Text>
                </GridItem>
              ))}

              <GridItem colSpan={{ base: 2, md: 1 }}>
                <Text fontSize="sm" fontWeight="bold" color={'blackAlpha.900'}>Attendees</Text>
                {renderAttendees()}
              </GridItem>
            </Grid>
          </Card>
        </GridItem>
      </Grid>

      {(user.role === 'superAdmin' || permission?.update || permission?.delete) && (
        <Card mt={3}>
          <Grid templateColumns="repeat(6, 1fr)" gap={1}>
            <GridItem colStart={6}>
              <Flex justifyContent="right">
                {(user.role === 'superAdmin' || permission?.delete) && (
                  <Button
                    size='sm'
                    bg="red.800"
                    onClick={() => setDeleteModalOpen(true)}
                    leftIcon={<DeleteIcon />}
                    colorScheme="red"
                  >
                    Delete
                  </Button>
                )}
              </Flex>
            </GridItem>
          </Grid>
        </Card>
      )}

      <CommonDeleteModel
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        type="Meetings"
        handleDeleteData={handleDeleteMeeting}
        ids={id}
      />
    </>
  );
};

export default View;
