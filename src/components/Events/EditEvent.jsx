import { Link, useNavigate, useParams } from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchEvent, queryClient, updateEvent } from "../../util/http.js";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { data, isError, error } = useQuery({
        queryKey: ["events", { id }],
        queryFn: ({ signal }) => fetchEvent({ id, signal }),
    });

    const { mutate } = useMutation({
        mutationFn: updateEvent,
        onMutate: async ({ event }) => {
            await queryClient.cancelQueries({ queryKey: ["events", { id }] });
            const currEvent = queryClient.getQueryData(["events", { id }]);
            queryClient.setQueryData(["events", { id }], event);

            return { previousEvent: currEvent };
        },
        onError: (error, data, context) => {
            queryClient.setQueryData(["events", { id }], context.previousEvent);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["events", { id }] });
        },
    });
    function handleSubmit(formData) {
        mutate({ id, event: formData });
        navigate("../");
    }

    function handleClose() {
        navigate("../");
    }

    let content = (
        <div className="center">
            <LoadingIndicator />
        </div>
    );
    if (data) {
        content = (
            <EventForm inputData={data} onSubmit={handleSubmit}>
                <Link to="../" className="button-text">
                    Cancel
                </Link>
                <button type="submit" className="button">
                    Update
                </button>
            </EventForm>
        );
    }
    if (isError) {
        content = (
            <>
                <ErrorBlock
                    title="Failed to load Event"
                    message={
                        error.info?.message ||
                        "Failed to load event. Please check inputs and try again later"
                    }
                />
                <div className="form-actions">
                    <Link to="../" className="button">
                        Okay
                    </Link>
                </div>
            </>
        );
    }

    return <Modal onClose={handleClose}>{content}</Modal>;
}
