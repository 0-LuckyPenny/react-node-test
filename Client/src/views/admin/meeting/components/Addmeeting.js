import {
    Button,
    FormLabel,
    Grid,
    GridItem,
    IconButton,
    Input,
    Modal,
    Flex,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Radio,
    RadioGroup,
    Stack,
    Text,
    Textarea,
  } from '@chakra-ui/react';
  import { CUIAutoComplete } from 'chakra-ui-autocomplete';
  import MultiContactModel from 'components/commonTableModel/MultiContactModel';
  import MultiLeadModel from 'components/commonTableModel/MultiLeadModel';
  import Spinner from 'components/spinner/Spinner';
  import dayjs from 'dayjs';
  import { useFormik } from 'formik';
  import { useEffect, useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { useDispatch, useSelector } from 'react-redux';
  import { LiaMousePointerSolid } from 'react-icons/lia';
  import { toast } from 'react-toastify';
  import { MeetingSchema } from 'schema';
  import { postApi } from 'services/api';
  import { fetchMeetingData } from '../../../../redux/slices/meetingSlice';
  
  const AddMeeting = ({ onClose, isOpen, setAction, from, fetchData, view, leadContect, id }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [contactModelOpen, setContactModel] = useState(false);
    const [leadModelOpen, setLeadModel] = useState(false);
    const [data, setData] = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));
    const dispatch = useDispatch();
    const navigate = useNavigate();
  
    const contactData = useSelector((state) => state?.contactData?.data);
    const leadData = useSelector((state) => state?.leadData?.data);
  
    const todayTime = new Date().toISOString().split('.')[0];
  
    const initialValues = {
      agenda: '',
      attendes: leadContect === 'contactView' && id ? [id] : [],
      attendesLead: leadContect === 'leadView' && id ? [id] : [],
      location: '',
      related: leadContect === 'contactView' ? 'Contact' : leadContect === 'leadView' ? 'Lead' : 'None',
      dateTime: '',
      notes: '',
      createBy: user?._id,
    };
  
    const formik = useFormik({
      initialValues,
      validationSchema: MeetingSchema,
      onSubmit: (values, { resetForm }) => {
        handleAddMeeting(values);
        resetForm();
        navigate(0);
      },
    });
  
    const { errors, touched, values, handleBlur, handleChange, handleSubmit, setFieldValue } = formik;
  
    const handleAddMeeting = async (values) => {
      try {
        setIsLoading(true);
        const response = await postApi('api/meeting/add', values);
        if (response.status === 200) {
          onClose();
          fetchData(1);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
  
    const fetchAllTemp = async () => {
      setIsLoading(true);
      const result = await dispatch(fetchMeetingData());
      if (result.payload.status === 200) {
        setData(result?.payload?.data?.data);
      } else {
        toast.error('Failed to fetch data');
      }
      setIsLoading(false);
    };
  
    useEffect(() => {
      fetchAllTemp();
    }, []);
  
    const extractLabels = (selectedItems) => selectedItems.map((item) => item._id);
  
    const countriesWithEmailAsLabel = (values.related === 'Contact' ? contactData : leadData)?.map((item) => ({
      ...item,
      value: item._id,
      label: values.related === 'Contact' ? `${item.firstName} ${item.lastName}` : item.leadName,
    }));
  
    return (
      <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent height={'580px'}>
          <ModalHeader>Add Meeting</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY={'auto'} height={'400px'}>
            {/* Contact Model */}
            <MultiContactModel data={contactData} isOpen={contactModelOpen} onClose={setContactModel} fieldName="attendes" setFieldValue={setFieldValue} />
            {/* Lead Model */}
            <MultiLeadModel data={leadData} isOpen={leadModelOpen} onClose={setLeadModel} fieldName="attendesLead" setFieldValue={setFieldValue} />
  
            <Grid templateColumns="repeat(12, 1fr)" gap={3}>
              {/* Agenda */}
              <GridItem colSpan={12}>
                <FormLabel fontSize="sm" fontWeight="500" mb="8px">
                  Agenda<Text color="red">*</Text>
                </FormLabel>
                <Input
                  fontSize="sm"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.agenda}
                  name="agenda"
                  placeholder="Agenda"
                  fontWeight="500"
                  borderColor={errors.agenda && touched.agenda ? 'red.300' : null}
                />
                <Text fontSize="sm" mb="10px" color="red">
                  {errors.agenda && touched.agenda && errors.agenda}
                </Text>
              </GridItem>
  
              {/* Related To */}
              <GridItem colSpan={12}>
                <FormLabel fontSize="sm" fontWeight="500" mb="8px">
                  Related To<Text color="red">*</Text>
                </FormLabel>
                <RadioGroup onChange={(e) => setFieldValue('related', e)} value={values.related}>
                  <Stack direction="row">
                    {leadContect === 'contactView' && <Radio value="Contact">Contact</Radio>}
                    {leadContect === 'leadView' && <Radio value="Lead">Lead</Radio>}
                    {!leadContect && (
                      <>
                        <Radio value="Contact">Contact</Radio>
                        <Radio value="Lead">Lead</Radio>
                      </>
                    )}
                  </Stack>
                </RadioGroup>
                <Text mb="10px" color="red" fontSize="sm">
                  {errors.related && touched.related && errors.related}
                </Text>
              </GridItem>
  
              {/* Attendees */}
              {(values.related === 'Contact' ? contactData?.length : leadData?.length) > 0 && values.related && (
                <GridItem colSpan={12}>
                  <Flex alignItems="end" justifyContent="space-between">
                    <Text w="100%">
                      <CUIAutoComplete
                        label={`Choose Preferred Attendees ${values.related === 'Contact' ? 'Contact' : 'Lead'}`}
                        placeholder="Type a Name"
                        name="attendes"
                        items={countriesWithEmailAsLabel}
                        className="custom-autoComplete"
                        selectedItems={countriesWithEmailAsLabel?.filter(
                          (item) =>
                            values.related === 'Contact' ? values?.attendes.includes(item._id) : values.related === 'Lead' && values?.attendesLead.includes(item._id)
                        )}
                        onSelectedItemsChange={(changes) => {
                          const selectedLabels = extractLabels(changes.selectedItems);
                          values.related === 'Contact' ? setFieldValue('attendes', selectedLabels) : setFieldValue('attendesLead', selectedLabels);
                        }}
                      />
                    </Text>
                    <IconButton
                      mb={6}
                      onClick={() => (values.related === 'Contact' ? setContactModel(true) : setLeadModel(true))}
                      fontSize="25px"
                      icon={<LiaMousePointerSolid />}
                    />
                  </Flex>
                  <Text color="red">{errors.attendes && touched.attendes && errors.attendes}</Text>
                </GridItem>
              )}
  
              {/* Location */}
              <GridItem colSpan={12}>
                <FormLabel fontSize="sm" fontWeight="500" mb="8px">
                  Location
                </FormLabel>
                <Input
                  fontSize="sm"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.location}
                  name="location"
                  placeholder="Location"
                  fontWeight="500"
                  borderColor={errors.location && touched.location ? 'red.300' : null}
                />
                <Text mb="10px" color="red" fontSize="sm">
                  {errors.location && touched.location && errors.location}
                </Text>
              </GridItem>
  
              {/* Date Time */}
              <GridItem colSpan={12}>
                <FormLabel fontSize="sm" fontWeight="500" mb="8px">
                  Date Time<Text color="red">*</Text>
                </FormLabel>
                <Input
                  fontSize="sm"
                  type="datetime-local"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min={dayjs(todayTime).format('YYYY-MM-DD HH:mm')}
                  value={values.dateTime}
                  name="dateTime"
                  fontWeight="500"
                  borderColor={errors.dateTime && touched.dateTime ? 'red.300' : null}
                />
                <Text fontSize="sm" mb="10px" color="red">
                  {errors.dateTime && touched.dateTime && errors.dateTime}
                </Text>
              </GridItem>
  
              {/* Notes */}
              <GridItem colSpan={12}>
                <FormLabel fontSize="sm" fontWeight="500" mb="8px">
                  Notes
                </FormLabel>
                <Textarea
                  resize="none"
                  fontSize="sm"
                  placeholder="Notes"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.notes}
                  name="notes"
                  fontWeight="500"
                  borderColor={errors.notes && touched.notes ? 'red.300' : null}
                />
                <Text mb="10px" color="red">
                  {errors.notes && touched.notes && errors.notes}
                </Text>
              </GridItem>
            </Grid>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="brand" me={2} disabled={isLoading} onClick={handleSubmit}>
              {isLoading ? <Spinner /> : 'Save'}
            </Button>
            <Button variant="outline" colorScheme="red" size="sm" onClick={() => { formik.resetForm(); onClose(); }}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  export default AddMeeting;
  